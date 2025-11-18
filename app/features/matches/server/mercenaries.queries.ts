import { prisma } from "~/libs/index.server";

export async function findMatchClubById(id: string) {
  return await prisma.matchClub.findFirst({ where: { id, isUse: true } });
}

export async function findApprovedPlayersByClub(clubId: string) {
  return await prisma.player.findMany({ where: { clubId, status: "APPROVED" } });
}

export async function findActivePlayerByClubAndUser(clubId: string, userId: string) {
  return await prisma.player.findFirst({
    where: { clubId, userId, status: { in: ["APPROVED", "PENDING"] } },
  });
}

export async function findMercenariesByClub(clubId: string) {
  return await prisma.mercenary.findMany({
    where: { clubId },
    include: {
      user: { include: { userImage: true } },
    },
  });
}

export async function findUpcomingMatchClubsByClub(clubId: string, now: Date) {
  return await prisma.matchClub.findMany({
    where: {
      clubId,
      isUse: true,
      match: { stDate: { gt: now } },
    },
    include: {
      match: true,
      attendances: true,
    },
  });
}

export async function findMercenaryById(id: string) {
  return await prisma.mercenary.findUnique({
    where: { id },
    include: {
      attendances: true,
      user: true,
    },
  });
}
