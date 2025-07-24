// POST /api/post-like
import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const commentId = data.commentId as string;
  const vote = parseInt(data.vote as string, 10);

  if (!userId || !commentId) {
    return Response.json({ success: false }, { status: 400 });
  }
  if (!commentId || ![-1, 0, 1].includes(vote)) {
    return Response.json(
      { success: false, error: "Invalid vote value" },
      { status: 400 }
    );
  }

  await prisma.commentVote.upsert({
    where: {
      commentId_userId: {
        userId,
        commentId,
      },
    },
    update: {
      vote,
    },
    create: {
      userId,
      commentId,
      vote,
    },
  });

  const sum = await prisma.commentVote.aggregate({
    where: { commentId },
    _sum: { vote: true },
  });

  await prisma.postComment.update({
    where: { id: commentId },
    data: {
      voteCount: sum._sum.vote ?? 0,
    },
  });

  return Response.json({
    success: true,
    vote,
    sum: sum._sum.vote ?? 0,
  });
};
