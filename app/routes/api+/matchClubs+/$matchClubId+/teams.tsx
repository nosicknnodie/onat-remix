import type { LoaderFunctionArgs } from "@remix-run/node";
import { teamService } from "~/features/matches/server";

const getClubIdFromRequest = (request: Request) => {
  const url = new URL(request.url);
  return url.searchParams.get("clubId");
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const clubId = getClubIdFromRequest(request);
  if (!clubId) {
    throw new Response("clubId is required", { status: 400 });
  }
  const data = await teamService.getTeamPageData(clubId, matchClubId);
  return Response.json(data);
};

export type MatchClubTeamApiResponse = Awaited<ReturnType<typeof loader>>;
