// POST /api/comment-vote
import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const commentId = data.commentId as string;
  const vote = parseInt(data.vote as string, 10) as -1 | 0 | 1;

  if (!userId || !commentId) return Response.json({ success: false }, { status: 400 });

  const result = await service.voteComment(userId, commentId, vote);
  if (!result.ok) {
    return Response.json(
      { success: false, error: result.message },
      { status: result.status ?? 500 },
    );
  }
  return Response.json({ success: true, vote: result.vote, sum: result.sum });
};
