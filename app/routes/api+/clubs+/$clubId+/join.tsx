import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/server";
import { getUser } from "~/libs/server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // user check
  const user = await getUser(request);
  if (!user)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED", redirectTo: "/auth/login" },
      { status: 401 },
    );

  // club check
  const clubId = params.clubId;
  if (!clubId)
    return Response.json(
      {
        ok: false,
        message: "clubId is required",
        code: "VALIDATION",
        fieldErrors: { id: ["required"] },
      },
      { status: 422 },
    );

  // nick check
  const raw = await request.json();
  const nick = raw.nick;

  const result = await service.joinClub(clubId, user.id, nick);

  if (result.ok) {
    return Response.json({
      ok: true,
      message: result.message,
      data: { redirectTo: `/clubs/${clubId}` },
      success: result.message,
      redirectTo: `/clubs/${clubId}`,
    });
  } else {
    return Response.json(
      { ok: false, message: result.message, code: "VALIDATION" },
      { status: 422 },
    );
  }
};
