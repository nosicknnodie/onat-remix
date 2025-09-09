/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/communities/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData.server";

export async function action({ params, request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return Response.json({ success: false }, { status: 401 });
  const commentId = params.id as string;

  if (request.method === "DELETE") {
    const result = await service.deleteComment(commentId, user.id);
    if (result.ok) return Response.json({ success: true });
    return Response.json({ success: false, errors: result.message }, { status: 500 });
  }

  const data = await parseRequestData(request);
  const content = data.content;

  const result = await service.updateComment(commentId, user.id, content);
  if (result.ok) return Response.json({ success: true });
  return Response.json({ success: false, errors: result.message }, { status: 500 });
}
