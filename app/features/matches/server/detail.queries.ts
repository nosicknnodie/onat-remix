import { matchSummaryRelations } from "~/features/matches/isomorphic";
import { prisma } from "~/libs/db/db.server";

export async function findMatchByIdWithClubs(id: string) {
  return await prisma.match.findUnique({
    where: { id },
    include: {
      createUser: { include: { userImage: true } },
      createPlayer: { include: { user: { include: { userImage: true } } } },
      matchClubs: {
        where: { isUse: true },
        include: matchSummaryRelations,
      },
    },
  });
}

export async function updateMatch(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    stDate: Date;
    placeName?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    createUserId?: string;
    createPlayerId?: string | null;
  }>,
) {
  return await prisma.match.update({ where: { id }, data });
}

export async function findMatchClubIds(matchId: string) {
  return await prisma.matchClub.findMany({
    where: { matchId },
    select: { clubId: true, id: true },
  });
}

export async function findPlayerByUserAndClubIds(userId: string, clubIds: string[]) {
  if (clubIds.length === 0) return null;
  return await prisma.player.findFirst({
    where: { userId, clubId: { in: clubIds } },
  });
}
