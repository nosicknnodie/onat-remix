import type { LoaderFunctionArgs } from "@remix-run/node";
import { dashboardService } from "~/features/dashboard/server";
import { getUser } from "~/libs/index.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const year = url.searchParams.get("year") ?? undefined;

  const history = await dashboardService.getPerformanceHistory(user.id, year);
  return Response.json(history, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
