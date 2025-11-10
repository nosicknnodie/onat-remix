import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/index.server";

export async function getManagerClub(userId: string, clubId: string) {
  return await prisma.player.findFirst({
    where: { userId, clubId, role: { in: ["MASTER", "MANAGER"] } },
    include: { club: true },
  });
}

export async function getManagerClubs(userId: string) {
  const players = await prisma.player.findMany({
    where: { userId, role: { in: ["MASTER", "MANAGER"] } },
    include: { club: true },
  });
  return players.map((p) => p.club);
}

export async function withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return await prisma.$transaction(async (tx) => fn(tx));
}

export async function createMatchTx(
  tx: Prisma.TransactionClient,
  data: {
    title: string;
    description: string;
    stDate: Date;
    placeName?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    createUserId: string;
  },
) {
  return await tx.match.create({ data });
}

export async function createMatchClubTx(
  tx: Prisma.TransactionClient,
  data: { matchId: string; clubId: string; isSelf: boolean },
) {
  return await tx.matchClub.create({ data });
}

export async function findLatestSelfTeamsTx(tx: Prisma.TransactionClient, clubId: string) {
  const before = await tx.matchClub.findFirst({
    where: { clubId, isSelf: true },
    orderBy: { match: { stDate: "desc" } },
    include: { teams: true },
  });
  return before?.teams ?? [];
}

export async function createTeamTx(
  tx: Prisma.TransactionClient,
  data: { name: string; color: string; matchClubId: string },
) {
  return await tx.team.create({ data });
}

export async function findTeamsByMatchClubTx(tx: Prisma.TransactionClient, matchClubId: string) {
  return await tx.team.findMany({ where: { matchClubId } });
}

export async function createQuarterTx(
  tx: Prisma.TransactionClient,
  data: { order: number; matchClubId: string; isSelf: boolean; team1Id?: string; team2Id?: string },
) {
  return await tx.quarter.create({ data });
}
