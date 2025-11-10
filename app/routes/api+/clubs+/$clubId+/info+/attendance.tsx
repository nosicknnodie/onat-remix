import type { LoaderFunctionArgs } from "@remix-run/node";
import { infoService } from "~/features/clubs/server";

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
    const attendance = await infoService.getAttendanceSummary(clubId);
    return Response.json({ ok: true, data: { attendance }, attendance });
  } catch (e) {
    return Response.json({ ok: false, message: String(e), code: "SERVER" }, { status: 500 });
  }
}
