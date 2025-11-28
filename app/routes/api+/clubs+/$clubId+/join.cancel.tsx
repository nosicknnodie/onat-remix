import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/server";
import { getUser } from "~/libs/server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const user = await getUser(request);
  if (!user) {
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED", redirectTo: "/auth/login" },
      { status: 401 },
    );
  }

  const clubId = params.clubId;
  if (!clubId) {
    return Response.json(
      {
        ok: false,
        message: "clubId is required",
        code: "VALIDATION",
        fieldErrors: { id: ["required"] },
      },
      { status: 422 },
    );
  }

  const result = await service.cancelJoinRequest(clubId, user.id);

  if (result.ok) {
    return Response.json({ ok: true, message: result.message, success: result.message });
  }

  return Response.json({ ok: false, message: result.message, code: "VALIDATION" }, { status: 422 });
};
