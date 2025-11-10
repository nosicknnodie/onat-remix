import type { LoaderFunctionArgs } from "@remix-run/node";
import { infoService } from "~/features/clubs/server";

export async function loader({ params, request }: LoaderFunctionArgs) {
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

  const url = new URL(request.url);
  const takeParam = url.searchParams.get("take");
  let take: number | undefined;
  if (takeParam) {
    take = Number(takeParam);
    if (!Number.isFinite(take) || take <= 0) {
      return Response.json(
        {
          ok: false,
          message: "take must be a positive number",
          code: "VALIDATION",
          fieldErrors: { take: ["positive_number"] },
        },
        { status: 422 },
      );
    }
  }

  try {
    const notices = await infoService.getRecentNoticesSummary(clubId, take);
    return Response.json({ ok: true, data: notices, notices });
  } catch (e) {
    return Response.json({ ok: false, message: String(e), code: "SERVER" }, { status: 500 });
  }
}
