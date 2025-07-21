// POST /api/post-like
import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const postId = data.postId as string;
  const vote = parseInt(data.vote as string, 10);

  if (!userId || !postId) {
    return Response.json({ success: false }, { status: 400 });
  }
  if (!postId || ![-1, 0, 1].includes(vote)) {
    return Response.json(
      { success: false, error: "Invalid vote value" },
      { status: 400 }
    );
  }

  await prisma.postVote.upsert({
    where: {
      postId_userId: {
        userId,
        postId,
      },
    },
    update: {
      vote,
    },
    create: {
      userId,
      postId,
      vote,
    },
  });

  const sum = await prisma.postVote.aggregate({
    where: { postId },
    _sum: { vote: true },
  });

  return Response.json({
    success: true,
    vote,
    sum: sum._sum.vote ?? 0,
  });
};
