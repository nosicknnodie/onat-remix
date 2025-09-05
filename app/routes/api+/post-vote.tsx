// POST /api/post-vote
import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const postId = data.postId as string;
  const vote = parseInt(data.vote as string, 10) as -1 | 0 | 1;

  if (!userId || !postId) return Response.json({ success: false }, { status: 400 });

  const result = await service.votePost(userId, postId, vote);
  if (!result.ok) {
    return Response.json({ success: false, error: result.message }, { status: result.status ?? 500 });
  }
  return Response.json({ success: true, vote: result.vote, sum: result.sum });
};
