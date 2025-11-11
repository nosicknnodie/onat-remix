import type { LoaderFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/server";

export async function loader({ request, params }: LoaderFunctionArgs) {
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
    const url = new URL(request.url);
    const take = Math.min(Number(url.searchParams.get("take")) || 20, 50);
    const cursor = url.searchParams.get("cursor");
    const matches = await service.getClubMatchesFeed({ clubId, take, cursor });
    return Response.json({ ok: true, data: matches });
  } catch (error) {
    return Response.json({ ok: false, message: String(error), code: "SERVER" }, { status: 500 });
  }
}
