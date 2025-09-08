import { prisma } from "~/libs/db/db.server";

export async function getMatchesWithClubs() {
  return await prisma.match.findMany({
    include: {
      matchClubs: { include: { club: { include: { image: true, emblem: true } } } },
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
