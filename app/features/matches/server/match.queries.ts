import { prisma } from "~/libs/server/db/db";

export async function deactivateMatchClub(matchClubId: string) {
  return await prisma.matchClub.update({
    where: { id: matchClubId },
    data: { isUse: false },
  });
}

export async function findMatchClubWithMatch(matchClubId: string) {
  return await prisma.matchClub.findFirst({
    where: { id: matchClubId, isUse: true },
    include: {
      match: true,
    },
  });
}
