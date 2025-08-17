import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { generateShortId } from "~/libs/id";
import { isMobile } from "~/libs/isMobile";
import { parseRequestData } from "~/libs/requestData";

type PostCommentWithAuthor = Awaited<
  ReturnType<typeof prisma.postComment.findMany>
>[number];

type CommentTreeNode = PostCommentWithAuthor & {
  children: CommentTreeNode[];
};

function buildCommentTree(
  comments: PostCommentWithAuthor[]
): CommentTreeNode[] {
  const map = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });

  comments.forEach((comment) => {
    const node = map.get(comment.id)!;
    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // parent가 삭제되었거나 없는 경우 root 처리
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const postId = params.id;

  if (!postId) {
    throw new Response("Post ID is required", { status: 400 });
  }

  const data = await parseRequestData(request);
  const path = data?.path as string | undefined;

  const _isMobile = isMobile(request);
  const limitDepth = _isMobile ? 3 : 5;

  const flatComments = await prisma.postComment.findMany({
    where: {
      postId,
      ...(path && { path: { startsWith: path } }),
      depth: {
        lte: path ? path.split(".").length - 1 + limitDepth : limitDepth,
      },
    },
    orderBy: { path: "asc" },
    include: {
      votes: true,
      author: { include: { userImage: true } },
    },
  });

  const comments = flatComments.map((comment) => {
    return {
      ..._.omit(comment, "votes"),
      sumVote: comment.votes.reduce((acc, v) => acc + v.vote, 0),
      currentVote: comment.votes.find((vote) => vote.userId === user?.id),
    };
  });

  const commentTree = buildCommentTree(comments);

  return Response.json({
    success: true,
    comments: commentTree,
    isMobile: _isMobile,
    startDepth: path ? path.split(".").length - 1 : 0,
    limitDepth: path ? path.split(".").length - 1 + limitDepth : limitDepth,
  });
};

// POST /api/posts/$id/comments
export async function action({ params, request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return Response.json({ success: false }, { status: 401 });
  const postId = params.id as string;
  const data = await parseRequestData(request);
  const { parentId, content } = data;

  try {
    // indexId create
    const indexId = generateShortId(); // base36 + 랜덤 조합

    // get parent
    const parent = parentId
      ? await prisma.postComment.findUnique({ where: { id: parentId } })
      : null;

    const depth = parent ? parent.depth + 1 : 0;
    const path = parent ? `${parent.path}.${indexId}` : indexId;

    // Image Upload
    const contentJSON = content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        parentId,
        indexId,
        path,
        depth,
        content,
        files: {
          connect: usedImageIds.map((id) => ({ id })),
        },
      },
    });
    if (comment) {
      await prisma.file.updateMany({
        where: {
          id: { in: usedImageIds },
        },
        data: {
          isTemp: false,
        },
      });
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
