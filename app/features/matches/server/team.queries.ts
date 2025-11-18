import { prisma } from "~/libs/index.server";

export async function findMatchClubTeams(matchClubId: string) {
  return await prisma.matchClub.findFirst({
    where: { id: matchClubId, isUse: true },
    select: {
      id: true,
      isSelf: true,
      teams: {
        orderBy: { seq: "asc" },
      },
    },
  });
}
