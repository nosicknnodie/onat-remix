import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/index.server";
import { getUser } from "~/libs/index.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // user check
  const user = await getUser(request);
  if (!user) return Response.json({ success: true, redirectTo: "/auth/login" });

  // club check
  const clubId = params.id;
  if (!clubId) return Response.json({ error: "clubId is required" }, { status: 400 });

  // nick check
  const raw = await request.json();
  const nick = raw.nick;

  const result = await service.joinClub(clubId, user.id, nick);

  if (result.ok) {
    return Response.json({
      success: result.message,
      redirectTo: `/clubs/${clubId}`,
    });
  } else {
    return Response.json({ error: result.message }, { status: 400 });
  }
};
