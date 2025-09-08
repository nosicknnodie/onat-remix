import { prisma } from "~/libs/db/db.server";

export async function findMatchClubTeamsAndAttendances(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: {
      attendances: {
        where: { isVote: true },
        include: {
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
      teams: {
        include: {
          attendances: {
            where: { isVote: true },
            include: {
              player: { include: { user: { include: { userImage: true } } } },
              mercenary: { include: { user: { include: { userImage: true } } } },
            },
          },
        },
      },
    },
  });
}
