import type { LoaderFunctionArgs } from "@remix-run/node";
import { ratingService } from "~/features/matches/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const matchClubId = url.searchParams.get("matchClubId");
  if (!matchClubId) return { error: "Unauthorized" };
  const attendances = await ratingService.getRatingAttendances({ matchClubId });
  return Response.json({ attendances });
};
