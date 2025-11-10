import { prisma } from "~/libs/index.server";

export async function findMatchClubById(id: string) {
  return await prisma.matchClub.findUnique({ where: { id } });
}

export async function findApprovedPlayersByClub(clubId: string) {
  return await prisma.player.findMany({ where: { clubId, status: "APPROVED" } });
}

export async function findMercenariesByClub(clubId: string) {
  return await prisma.mercenary.findMany({
    where: { clubId },
    include: {
      attendances: { include: { matchClub: { include: { match: true } } } },
      user: { include: { userImage: true } },
    },
  });
}
