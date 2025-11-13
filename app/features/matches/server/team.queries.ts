import { prisma } from "~/libs/index.server";

export async function findMatchClubTeams(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    select: {
      id: true,
      isSelf: true,
      teams: {
        orderBy: { seq: "asc" },
      },
    },
  });
}
