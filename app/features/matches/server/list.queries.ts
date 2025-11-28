import { prisma } from "~/libs/server";

export async function getMatchesWithClubs() {
  return await prisma.match.findMany({
    include: {
      matchClubs: {
        where: { isUse: true },
        include: { club: { include: { image: true, emblem: true } } },
      },
    },
  });
}

export async function getApprovedPlayerClubIds(userId: string) {
  const list = await prisma.player.findMany({
    where: { userId, status: "APPROVED" },
    select: { clubId: true },
  });
  return list.map((c) => c.clubId);
}
