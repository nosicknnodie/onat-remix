import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithRelations(id: string) {
  return await prisma.matchClub.findUnique({
    where: { id },
    include: {
      club: { include: { image: true, emblem: true } },
      quarters: { include: { team1: true, team2: true } },
      teams: true,
      attendances: {
        where: { isVote: true },
        include: {
          assigneds: true,
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
    },
  });
}

export async function findApprovedPlayer(userId: string, clubId: string) {
  return await prisma.player.findFirst({ where: { userId, clubId, status: "APPROVED" } });
}
