import type { LoaderFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/index.server";

export async function loader({ params }: LoaderFunctionArgs) {
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
  try {
    const players = await service.getAllClubPlayers(clubId);
    return Response.json({ ok: true, data: { players }, players });
  } catch (e) {
    return Response.json({ ok: false, message: String(e), code: "SERVER" }, { status: 500 });
  }
}
