import type { ActionFunctionArgs } from "@remix-run/node";
import { ratingService } from "~/features/matches/server";
import { getUser } from "~/libs/index.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    return Response.json({ error: "matchClubId is required" }, { status: 400 });
  }
  const data = await ratingService.updateSeeds(matchClubId, user.id);
  if (!data.ok) {
    return Response.json(data, { status: 400 });
  }
  return Response.json({ ...data });
}
