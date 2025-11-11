import type { LoaderFunctionArgs } from "@remix-run/node";
import { boardService } from "~/features/clubs/server";
import { getUser } from "~/libs/db/lucia.server";

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
    const user = await getUser(request);
    const url = new URL(request.url);
    const take = Math.min(Number(url.searchParams.get("take")) || 30, 50);
    const cursor = url.searchParams.get("cursor");

    const feed = await boardService.getClubFeed({
      clubId,
      take,
      cursor,
      userId: user?.id,
    });

    return Response.json({ ok: true, data: feed });
  } catch (error) {
    return Response.json({ ok: false, message: String(error), code: "SERVER" }, { status: 500 });
  }
}
