// POST /api/post-vote
import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities/server";
import { getUser, parseRequestData } from "~/libs/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const userId = user?.id;
  const postId = data.postId as string;
  const vote = parseInt(data.vote as string, 10) as -1 | 0 | 1;

  if (!userId)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  if (!postId)
    return Response.json(
      {
        ok: false,
        message: "postId is required",
        code: "VALIDATION",
        fieldErrors: { postId: ["required"] },
      },
      { status: 422 },
    );

  const result = await service.votePost(userId, postId, vote);
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
