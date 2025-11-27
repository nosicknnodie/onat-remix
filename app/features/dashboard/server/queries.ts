import type { Prisma } from "@prisma/client";
import { matchSummaryRelations } from "~/features/matches/isomorphic";
import { prisma } from "~/libs/db/db.server";

export async function findApprovedPlayers(userId: string) {
  return await prisma.player.findMany({
    where: { userId, status: "APPROVED" },
    include: {
      club: {
        include: {
          emblem: true,
        },
      },
    },
  });
}

type MatchClubInclude = Prisma.MatchClubInclude;

export async function findMatchClubsInRange(args: { clubIds: string[]; start: Date; end: Date }) {
  if (args.clubIds.length === 0) return [];
  return await prisma.matchClub.findMany({
    where: {
      clubId: { in: args.clubIds },
      isUse: true,
      match: {
        stDate: {
          gte: args.start,
          lte: args.end,
        },
      },
    },
    include: {
      ...(matchSummaryRelations satisfies MatchClubInclude),
      match: true,
    },
    orderBy: {
      match: { stDate: "asc" },
    },
  });
}

export async function findUpcomingMatchClubs(args: { clubIds: string[]; start: Date; end: Date }) {
  if (args.clubIds.length === 0) return [];
  return await prisma.matchClub.findMany({
    where: {
      clubId: { in: args.clubIds },
      isUse: true,
      match: {
        stDate: {
          gte: args.start,
          lte: args.end,
        },
      },
    },
    include: {
      ...(matchSummaryRelations satisfies MatchClubInclude),
      match: true,
    },
    orderBy: {
      match: { stDate: "asc" },
    },
  });
}

export async function findHighlightPosts(args: {
  userId: string;
  clubIds: string[];
  take?: number;
}) {
  const { userId, clubIds } = args;
  if (!userId && clubIds.length === 0) return [];

  return await prisma.post.findMany({
    where: {
      state: "PUBLISHED",
      OR: [
        { authorId: userId },
        {
          board: {
            type: "NOTICE",
            clubId: { in: clubIds },
          },
        },
      ],
    },
    take: args.take ?? 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      authorId: true,
      board: {
        select: {
          id: true,
          name: true,
          slug: true,
          clubs: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function findUserAttendances(args: { userId: string; matchClubIds: string[] }) {
  if (args.matchClubIds.length === 0) return [];
  return await prisma.attendance.findMany({
    where: {
      matchClubId: { in: args.matchClubIds },
      OR: [{ player: { userId: args.userId } }, { mercenary: { userId: args.userId } }],
    },
    include: {
      player: true,
      mercenary: true,
    },
  });
}

export async function findPlayerStatsHistoryByYear(args: { playerIds: string[]; year: string }) {
  const { playerIds, year } = args;
  if (playerIds.length === 0) return [];
  return await prisma.playerStatsHistory.findMany({
    where: {
      playerId: { in: playerIds },
      periodKey: { startsWith: year },
    },
    orderBy: [{ periodType: "asc" }, { periodKey: "asc" }],
  });
}
