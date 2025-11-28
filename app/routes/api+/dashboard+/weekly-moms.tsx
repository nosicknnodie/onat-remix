import type { LoaderFunctionArgs } from "@remix-run/node";
import { dashboardService } from "~/features/dashboard/server";
import { getUser } from "~/libs/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weeklyMoms = await dashboardService.getWeeklyMomHighlights(user.id);
  return Response.json(weeklyMoms, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
