import type { LoaderFunctionArgs } from "@remix-run/node";
import type { MatchClubQueryResponse } from "~/features/matches/isomorphic";
import { clubService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }

  const matchClubData = await clubService.getMatchClubLayoutData(matchClubId);
  if (!matchClubData.matchClub) {
    throw new Response("Match club not found", { status: 404 });
  }

  const payload: MatchClubQueryResponse = matchClubData;
  return Response.json(payload);
};

export type MatchClubDetailApiResponse = Awaited<ReturnType<typeof loader>>;
