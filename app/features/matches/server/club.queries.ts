import { prisma } from "~/libs/server/db/db";

export async function findMatchClubWithRelations(id: string) {
  return await prisma.matchClub.findFirst({
    where: { id, isUse: true },
    include: {
      match: {
        include: {
          createUser: { include: { userImage: true } },
          createPlayer: { include: { user: { include: { userImage: true } } } },
        },
      },
      teams: true,
      quarters: { include: { team1: true, team2: true } },
    },
  });
}
