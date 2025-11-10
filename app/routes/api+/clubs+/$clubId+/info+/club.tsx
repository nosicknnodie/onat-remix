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

  const { club } = await infoService.getClubLayoutData(clubId);
  if (!club) {
    return Response.json({ ok: false, message: "클럽을 찾을 수 없습니다." }, { status: 404 });
  }

  return Response.json({ ok: true, data: club, club });
}
