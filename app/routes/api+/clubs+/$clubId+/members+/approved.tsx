import type { LoaderFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/server";

export async function loader({ params }: LoaderFunctionArgs) {
  const clubId = params.clubId;

  if (!clubId) {
    return Response.json(
      {
        ok: false,
        message: "clubId is required",
        code: "VALIDATION",
        fieldErrors: { clubId: ["required"] },
      },
      { status: 422 },
    );
  }

  try {
    const members = await service.getClubMembers(clubId);
    return Response.json({ ok: true, data: members });
  } catch (error) {
    return Response.json({ ok: false, message: String(error), code: "SERVER" }, { status: 500 });
  }
}
