import type { LoaderFunctionArgs } from "@remix-run/node";
import { boardService } from "~/features/clubs/server";
import { getUser } from "~/libs/server/db/lucia";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { clubId, slug } = params;

  if (!clubId || !slug) {
    return Response.json(
      {
        ok: false,
        message: "clubId and slug are required",
        code: "VALIDATION",
        fieldErrors: {
          clubId: clubId ? undefined : ["required"],
          slug: slug ? undefined : ["required"],
        },
      },
      { status: 422 },
    );
  }

  try {
    const user = await getUser(request);
    const url = new URL(request.url);
    const take = Math.min(Number(url.searchParams.get("take")) || 20, 50);
    const cursor = url.searchParams.get("cursor");

    const feed = await boardService.getBoardFeed({
      clubId,
      slug,
      take,
      cursor,
      userId: user?.id,
    });

    if (!feed.board) {
      return Response.json(
        { ok: false, message: "Board not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, data: feed });
  } catch (error) {
    return Response.json({ ok: false, message: String(error), code: "SERVER" }, { status: 500 });
  }
}
