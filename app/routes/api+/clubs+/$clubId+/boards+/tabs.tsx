import type { LoaderFunctionArgs } from "@remix-run/node";
import { boardService } from "~/features/clubs/server";

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
    const boardTabs = await boardService.getBoardTabs(clubId);
    return Response.json({ ok: true, data: boardTabs, boardTabs });
  } catch (e) {
    return Response.json({ ok: false, message: String(e), code: "SERVER" }, { status: 500 });
  }
}
