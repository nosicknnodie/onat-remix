import type { LoaderFunctionArgs } from "@remix-run/node";
import { dashboardService } from "~/features/dashboard/server";
import { getUser } from "~/libs/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const highlightPosts = await dashboardService.getHighlightPostsData(user.id);
  return Response.json(highlightPosts, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
