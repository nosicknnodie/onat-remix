import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
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
        return Response.json(
          { success: false, errors: "Comment not found" },
          { status: 404 }
        );
      }
      return Response.json({ success: true });
    } catch (error) {
      console.error(error);
      return Response.json(
        { success: false, errors: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  const data = await parseRequestData(request);
  const { content } = data;

  try {
    const comment = await prisma.postComment.update({
      where: {
        id: commentId,
        authorId: user.id,
      },
      data: {
        content,
      },
    });
    if (comment === null) {
      return Response.json(
        { success: false, errors: "Comment not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, errors: "Internal Server Error" },
      { status: 500 }
    );
  }
}
