import type { LoaderFunctionArgs } from "@remix-run/node";
import type { MercenaryQueryData } from "~/features/matches/isomorphic";
import { mercenaryService } from "~/features/matches/server";

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
    const { mercenaries } = await mercenaryService.getMercenaries(clubId);
    const data: MercenaryQueryData = { mercenaries };
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, message: String(e), code: "SERVER" }, { status: 500 });
  }
}
