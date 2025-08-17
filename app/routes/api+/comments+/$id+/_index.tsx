/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { deletePublicImage } from "~/libs/db/s3.server";
import { parseRequestData } from "~/libs/requestData";

export async function action({ params, request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return Response.json({ success: false }, { status: 401 });
  const commentId = params.id as string;

  if (request.method === "DELETE") {
    try {
      const comment = await prisma.postComment.update({
        where: {
          id: commentId,
          authorId: user.id,
        },
        data: {
          isDeleted: true,
        },
      });
      if (comment === null) {
        return Response.json({ success: false, errors: "Comment not found" }, { status: 404 });
      }
      return Response.json({ success: true });
    } catch (error) {
      console.error(error);
      return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
    }
  }

  const data = await parseRequestData(request);
  const content = data.content;

  try {
    const currentComment = await prisma.postComment.findUnique({
      where: {
        id: commentId,
        authorId: user.id,
      },
      include: {
        files: true,
      },
    });
    // content image check
    const contentJSON = content;
    const extractImageIds = (node: any): string[] => {
      if (!node || typeof node !== "object") return [];
      let ids: string[] = [];

      if (node.type === "image" && node.imageId) {
        ids.push(node.imageId);
      }

      if (node.root) {
        ids = ids.concat(extractImageIds(node.root));
      } else if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          ids = ids.concat(extractImageIds(child));
        }
      }

      return ids;
    };

    const usedImageIds = extractImageIds(contentJSON);
    const notUsedImages =
      currentComment?.files.filter((file) => !usedImageIds.includes(file.id)) ?? [];

    /**
     * Delete Not Used Images
     */
    if (notUsedImages.length > 0) {
      const successfullyDeletedIds: string[] = [];

      for (const file of notUsedImages) {
        try {
          if (file.key) {
            await deletePublicImage(file.key);
            successfullyDeletedIds.push(file.id);
          }
        } catch (err) {
          console.error("이미지 삭제 실패:", file.key, err);
        }
      }

      if (successfullyDeletedIds.length > 0) {
        await prisma.file.deleteMany({
          where: {
            id: {
              in: successfullyDeletedIds,
            },
          },
        });
      }
    }

    // Connect New Images
    const newImageIds = usedImageIds.filter(
      (id) => !currentComment?.files.some((file) => file.id === id),
    );

    const comment = await prisma.postComment.update({
      where: {
        id: commentId,
        authorId: user.id,
      },
      data: {
        content,
        files: {
          connect: newImageIds.map((id) => ({ id: id })),
        },
      },
    });
    if (comment === null) {
      return Response.json({ success: false, errors: "Comment not found" }, { status: 404 });
    }

    if (newImageIds.length > 0) {
      await prisma.file.updateMany({
        where: {
          id: {
            in: newImageIds,
          },
        },
        data: {
          isTemp: false,
        },
      });
    }

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
}
