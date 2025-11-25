import type { StatsPeriodType } from "@prisma/client";
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

type HistoryAverage = {
  voteCount: number;
  voteRate: number;
  checkCount: number;
  checkRate: number;
  matchCount: number;
};

const ZERO_HISTORY: HistoryAverage = {
  voteCount: 0,
  voteRate: 0,
  checkCount: 0,
  checkRate: 0,
  matchCount: 0,
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfQuarter = (date: Date) =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
const startOfHalfYear = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

async function calculateHistoryAverage(
  clubId: string,
  start: Date,
  end: Date,
): Promise<HistoryAverage> {
  const totals = await prisma.matchClubStatsTotal.findMany({
    where: {
      matchClub: {
        clubId,
        match: {
          stDate: {
            gte: start,
            lte: end,
          },
        },
      },
    },
    select: { voteCount: true, voteRate: true, checkCount: true, checkRate: true },
  });

  if (!totals.length) return { ...ZERO_HISTORY };

  const sums = totals.reduce<HistoryAverage>(
    (acc, cur) => {
      const voteCount = acc.voteCount + cur.voteCount;
      const voteRate = acc.voteRate + cur.voteRate;
      const checkCount = acc.checkCount + cur.checkCount;
      const checkRate = acc.checkRate + cur.checkRate;
      const matchCount = acc.matchCount + 1;
      return { voteCount, voteRate, checkCount, checkRate, matchCount };
    },
    { ...ZERO_HISTORY },
  );

  const length = totals.length;

  return {
    voteCount: Math.round(sums.voteCount / length),
    voteRate: Math.round(sums.voteRate / length),
    checkCount: Math.round(sums.checkCount / length),
    checkRate: Math.round(sums.checkRate / length),
    matchCount: sums.matchCount,
  };
}

const formatPeriodKey = (date: Date, type: StatsPeriodType): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  switch (type) {
    case "MONTH":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "QUARTER":
      return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
    case "HALF_YEAR":
      return `${year}-H${month <= 6 ? 1 : 2}`;
    case "YEAR":
      return `${year}`;
    default:
      return `${year}`;
  }
};

async function upsertMatchClubTotalHistory(matchClubId: string, clubId: string, matchDate: Date) {
  const periods: Array<{
    type: StatsPeriodType;
    start: Date;
  }> = [
    { type: "MONTH", start: startOfMonth(matchDate) },
    { type: "QUARTER", start: startOfQuarter(matchDate) },
    { type: "HALF_YEAR", start: startOfHalfYear(matchDate) },
    { type: "YEAR", start: startOfYear(matchDate) },
  ];

  const histories = await Promise.all(
    periods.map(async (period) => {
      const history = await calculateHistoryAverage(clubId, period.start, matchDate);
      return {
        ...history,
        periodType: period.type,
        periodKey: formatPeriodKey(matchDate, period.type),
      };
    }),
  );

  await prisma.$transaction(
    histories.map((history) =>
      prisma.matchClubStatsHistory.upsert({
        where: {
          matchClubId_periodType_periodKey: {
            matchClubId,
            periodType: history.periodType,
            periodKey: history.periodKey,
          },
        },
        update: {
          voteCount: history.voteCount,
          voteRate: history.voteRate,
          checkCount: history.checkCount,
          checkRate: history.checkRate,
          matchCount: history.matchCount,
        },
        create: {
          matchClubId,
          periodType: history.periodType,
          periodKey: history.periodKey,
          voteCount: history.voteCount,
          voteRate: history.voteRate,
          checkCount: history.checkCount,
          checkRate: history.checkRate,
          matchCount: history.matchCount,
        },
      }),
    ),
  );
}

export async function recalcMatchClubStatistics(matchClubId: string) {
  const matchClub = await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    select: {
      clubId: true,
      match: { select: { stDate: true } },
    },
  });

  if (!matchClub || !matchClub.match?.stDate) return;

  const matchDate = new Date(matchClub.match.stDate);

  const [playerCount, voteCount, checkCount, mercenaryVoteCount, mercenaryCheckCount] =
    await Promise.all([
      prisma.player.count({ where: { clubId: matchClub.clubId, status: "APPROVED" } }),
      prisma.attendance.count({
        where: { matchClubId, playerId: { not: null }, isVote: true },
      }),
      prisma.attendance.count({
        where: { matchClubId, playerId: { not: null }, isCheck: true },
      }),
      prisma.attendance.count({
        where: { matchClubId, mercenaryId: { not: null }, isVote: true },
      }),
      prisma.attendance.count({
        where: { matchClubId, mercenaryId: { not: null }, isCheck: true },
      }),
    ]);

  const voteRate = playerCount > 0 ? Math.round((voteCount / playerCount) * 100) : 0;
  const checkRate = voteCount > 0 ? Math.round((checkCount / voteCount) * 100) : 0;

  const totalsData = {
    playerCount,
    voteCount,
    voteRate,
    checkCount,
    checkRate,
    mercenaryVoteCount,
    mercenaryCheckCount,
  };

  await prisma.matchClubStatsTotal.upsert({
    where: { matchClubId },
    update: totalsData,
    create: { matchClubId, ...totalsData },
  });

  await upsertMatchClubTotalHistory(matchClubId, matchClub.clubId, matchDate);
}
