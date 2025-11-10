// POST /api/comment-vote
import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities/server";
import { getUser, parseRequestData } from "~/libs/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const commentId = data.commentId as string;
  const vote = parseInt(data.vote as string, 10) as -1 | 0 | 1;

  if (!userId)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  if (!commentId)
    return Response.json(
      {
        ok: false,
        message: "commentId is required",
        code: "VALIDATION",
        fieldErrors: { commentId: ["required"] },
      },
      { status: 422 },
    );

  const result = await service.voteComment(userId, commentId, vote);
  if (!result.ok) {
    const status = result.status ?? 500;
    const code = status >= 500 ? "SERVER" : status === 403 ? "FORBIDDEN" : "UNKNOWN";
    return Response.json({ ok: false, message: result.message, code }, { status });
  }
  return Response.json({
    ok: true,
    data: { vote: result.vote, sum: result.sum },
    success: true,
    vote: result.vote,
    sum: result.sum,
  });
};
