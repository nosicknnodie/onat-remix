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
  const actionType = data.actionType as string;

  if (!userId || !postId || !actionType) {
    return Response.json({ success: false }, { status: 400 });
  }

  if (actionType === "like") {
    await prisma.postLike.create({ data: { userId, postId } });
  } else {
    await prisma.postLike.deleteMany({ where: { userId, postId } });
  }

  const likeCount = await prisma.postLike.count({ where: { postId } });
  const liked = await prisma.postLike.findFirst({ where: { postId, userId } });

  return Response.json({
    success: true,
    liked: Boolean(liked),
    likeCount,
  });
};
