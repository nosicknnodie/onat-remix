import { matchSummaryRelations } from "~/features/matches/isomorphic";
import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithRelations(id: string) {
  return await prisma.matchClub.findUnique({
    where: { id },
    include: {
      ...matchSummaryRelations,
      quarters: { include: { team1: true, team2: true } },
    },
  });
}
