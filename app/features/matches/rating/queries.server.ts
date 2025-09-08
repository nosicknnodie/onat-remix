import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithQuarters(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: { quarters: { include: { team1: true, team2: true } } },
  });
}
