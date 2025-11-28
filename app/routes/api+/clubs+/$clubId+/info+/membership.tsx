import type { LoaderFunctionArgs } from "@remix-run/node";
import { infoService } from "~/features/clubs/server";
import { getUser } from "~/libs/server";

export async function loader({ request, params }: LoaderFunctionArgs) {
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

  const user = await getUser(request);
  if (!user) {
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED", redirectTo: "/auth/login" },
      { status: 401 },
    );
  }

  const { player } = await infoService.getClubLayoutData(clubId, user.id);

  return Response.json({ ok: true, data: player, player });
}
