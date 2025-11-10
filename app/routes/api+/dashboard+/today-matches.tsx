import type { LoaderFunctionArgs } from "@remix-run/node";
import { dashboardService } from "~/features/dashboard/server";
import { getUser } from "~/libs/index.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayMatches = await dashboardService.getTodayMatchInsights(user.id);
  return Response.json(todayMatches, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
