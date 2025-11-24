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

async function upsertMatchClubTotalHistory(matchClubId: string, clubId: string, matchDate: Date) {
  const [monthly, quarterly, halfYear, yearly] = await Promise.all([
    calculateHistoryAverage(clubId, startOfMonth(matchDate), matchDate),
    calculateHistoryAverage(clubId, startOfQuarter(matchDate), matchDate),
    calculateHistoryAverage(clubId, startOfHalfYear(matchDate), matchDate),
    calculateHistoryAverage(clubId, startOfYear(matchDate), matchDate),
  ]);

  await prisma.matchClubStatsHistory.upsert({
    where: { matchClubId },
    update: {
      monthlyVoteCount: monthly.voteCount,
      monthlyVoteRate: monthly.voteRate,
      monthlyCheckCount: monthly.checkCount,
      monthlyCheckRate: monthly.checkRate,
      monthlyMatchCount: monthly.matchCount,
      quarterlyVoteCount: quarterly.voteCount,
      quarterlyVoteRate: quarterly.voteRate,
      quarterlyCheckCount: quarterly.checkCount,
      quarterlyCheckRate: quarterly.checkRate,
      quarterlyMatchCount: quarterly.matchCount,
      halfYearVoteCount: halfYear.voteCount,
      halfYearVoteRate: halfYear.voteRate,
      halfYearCheckCount: halfYear.checkCount,
      halfYearCheckRate: halfYear.checkRate,
      halfYearMatchCount: halfYear.matchCount,
      yearVoteCount: yearly.voteCount,
      yearVoteRate: yearly.voteRate,
      yearCheckCount: yearly.checkCount,
      yearCheckRate: yearly.checkRate,
      yearMatchCount: yearly.matchCount,
    },
    create: {
      matchClubId,
      monthlyVoteCount: monthly.voteCount,
      monthlyVoteRate: monthly.voteRate,
      monthlyCheckCount: monthly.checkCount,
      monthlyCheckRate: monthly.checkRate,
      monthlyMatchCount: monthly.matchCount,
      quarterlyVoteCount: quarterly.voteCount,
      quarterlyVoteRate: quarterly.voteRate,
      quarterlyCheckCount: quarterly.checkCount,
      quarterlyCheckRate: quarterly.checkRate,
      quarterlyMatchCount: quarterly.matchCount,
      halfYearVoteCount: halfYear.voteCount,
      halfYearVoteRate: halfYear.voteRate,
      halfYearCheckCount: halfYear.checkCount,
      halfYearCheckRate: halfYear.checkRate,
      halfYearMatchCount: halfYear.matchCount,
      yearVoteCount: yearly.voteCount,
      yearVoteRate: yearly.voteRate,
      yearCheckCount: yearly.checkCount,
      yearCheckRate: yearly.checkRate,
      yearMatchCount: yearly.matchCount,
    },
  });
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
