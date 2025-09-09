import type { LoaderFunctionArgs } from "@remix-run/node";
import { rating as ratingFeature } from "~/features/matches/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const matchClubId = url.searchParams.get("matchClubId");
  if (!matchClubId) return { error: "Unauthorized" };
  const attendances = await ratingFeature.queries.getRatingAttendances({ matchClubId });
  return Response.json({ attendances });
};
