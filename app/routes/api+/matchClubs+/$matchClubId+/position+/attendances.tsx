import type { LoaderFunctionArgs } from "@remix-run/node";
import { positionSerivce } from "~/features/matches/server";
import { getUser } from "~/libs/server/db/lucia";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    return Response.json({ error: "matchClubId is required" }, { status: 400 });
  }
  const data = await positionSerivce.getPositionAttendances(matchClubId);
  if (!data) {
    return Response.json({ error: "MatchClub not found" }, { status: 404 });
  }
  return Response.json(data);
};
