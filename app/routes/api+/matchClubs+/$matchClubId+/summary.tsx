import type { LoaderFunctionArgs } from "@remix-run/node";
import { detailService } from "~/features/matches/server";
import { prisma } from "~/libs/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }

  const matchClub = await prisma.matchClub.findFirst({
    where: { id: matchClubId, isUse: true },
    select: { matchId: true },
  });

  if (!matchClub?.matchId) {
    throw new Response("Match not found", { status: 404 });
  }

  const matchSummary = await detailService.getMatchDetail(matchClub.matchId);
  if (!matchSummary) {
    throw new Response("Match summary not found", { status: 404 });
  }

  return Response.json(matchSummary);
};

export type MatchClubMatchSummaryApiResponse = Awaited<ReturnType<typeof loader>>;
