import type { LoaderFunctionArgs } from "@remix-run/node";
import { detailService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchId = params.matchId;
  if (!matchId) {
    throw new Response("matchId is required", { status: 400 });
  }

  const matchSummary = await detailService.getMatchDetail(matchId);
  if (!matchSummary) {
    throw new Response("Match summary not found", { status: 404 });
  }

  return Response.json(matchSummary);
};

export type MatchDetailApiResponse = Awaited<ReturnType<typeof loader>>;
