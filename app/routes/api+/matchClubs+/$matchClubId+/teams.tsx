import type { LoaderFunctionArgs } from "@remix-run/node";
import { teamService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const data = await teamService.getTeamPageData(matchClubId);
  return Response.json(data);
};

export type MatchClubTeamApiResponse = Awaited<ReturnType<typeof loader>>;
