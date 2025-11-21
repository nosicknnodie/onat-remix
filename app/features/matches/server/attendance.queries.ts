import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithRelations(id: string) {
  return await prisma.matchClub.findFirst({
    where: { id, isUse: true },
    include: {
      match: true,
      club: {
        include: {
          image: true,
          emblem: true,
          mercenarys: { include: { user: { include: { userImage: true } } } },
          players: {
            where: { status: "APPROVED" },
            include: { user: { include: { userImage: true } } },
          },
        },
      },
      attendances: {
        include: {
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
          assigneds: { select: { id: true, quarterId: true, teamId: true } },
        },
      },
      teams: true,
    },
  });
}

export async function findApprovedPlayerWithUserAndAttendance(
  userId: string,
  clubId: string,
  matchClubId: string,
) {
  return await prisma.player.findUnique({
    where: { clubId_userId: { userId, clubId }, status: "APPROVED" },
    include: { attendances: { where: { matchClubId } }, user: { include: { userImage: true } } },
  });
}

export async function findMercenaryByUserInClubWithAttendance(
  userId: string,
  clubId: string,
  matchClubId: string,
) {
  return await prisma.mercenary.findUnique({
    where: { userId_clubId: { userId, clubId }, attendances: { some: { matchClubId } } },
    include: { attendances: true, user: { include: { userImage: true } } },
  });
}

export async function upsertAttendance(args: {
  matchClubId: string;
  playerId?: string | null;
  mercenaryId?: string | null;
  isVote: boolean;
  isCheck: boolean;
}) {
  const { matchClubId, playerId, mercenaryId, isVote, isCheck } = args;
  return await prisma.attendance.upsert({
    create: { matchClubId, playerId: mercenaryId ? null : playerId!, mercenaryId, isVote, isCheck },
    update: { isVote, isCheck },
    where: mercenaryId
      ? { matchClubId_mercenaryId: { matchClubId, mercenaryId } }
      : { matchClubId_playerId: { matchClubId, playerId: playerId! } },
  });
}
