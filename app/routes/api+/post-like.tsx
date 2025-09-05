// POST /api/post-like
import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const postId = data.postId as string;
  const actionType = data.actionType as "like" | "unlike" | undefined;

  if (!userId || !postId || !actionType) return Response.json({ success: false }, { status: 400 });

  const result = await service.togglePostLike(userId, postId, actionType);
  if (!result.ok) return Response.json({ success: false }, { status: 500 });
  return Response.json({ success: true, liked: result.liked, likeCount: result.likeCount });
};
