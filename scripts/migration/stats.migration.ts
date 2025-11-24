import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.db";

type MatchClubMeta = {
  id: string;
  clubId: string;
  matchDate: Date | null;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfQuarter = (date: Date) =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
const startOfHalfYear = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

async function upsertMatchClubTotalHistory(matchClubId: string, clubId: string, matchDate: Date) {
  const calculateHistoryAverage = async (
    start: Date,
    end: Date,
  ): Promise<{
    voteCount: number;
    voteRate: number;
    checkCount: number;
    checkRate: number;
    matchCount: number;
  }> => {
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
    if (!totals.length) {
      return { voteCount: 0, voteRate: 0, checkCount: 0, checkRate: 0, matchCount: 0 };
    }

    const initial = { voteCount: 0, voteRate: 0, checkCount: 0, checkRate: 0, matchCount: 0 };
    const sums = totals.reduce<typeof initial>(
      (acc, cur) => ({
        voteCount: acc.voteCount + cur.voteCount,
        voteRate: acc.voteRate + cur.voteRate,
        checkCount: acc.checkCount + cur.checkCount,
        checkRate: acc.checkRate + cur.checkRate,
        matchCount: acc.matchCount + 1,
      }),
      initial,
    );
    const length = totals.length;
    return {
      voteCount: Math.round(sums.voteCount / length),
      voteRate: Math.round(sums.voteRate / length),
      checkCount: Math.round(sums.checkCount / length),
      checkRate: Math.round(sums.checkRate / length),
      matchCount: sums.matchCount,
    };
  };

  const [monthly, quarterly, halfYear, yearly] = await Promise.all([
    calculateHistoryAverage(startOfMonth(matchDate), matchDate),
    calculateHistoryAverage(startOfQuarter(matchDate), matchDate),
    calculateHistoryAverage(startOfHalfYear(matchDate), matchDate),
    calculateHistoryAverage(startOfYear(matchDate), matchDate),
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

async function recalcMatchClubStatistics(meta: MatchClubMeta) {
  if (!meta.matchDate) return;
  const matchDate = new Date(meta.matchDate);
  const [playerCount, voteCount, checkCount, mercenaryVoteCount, mercenaryCheckCount] =
    await Promise.all([
      prisma.player.count({ where: { clubId: meta.clubId, status: "APPROVED" } }),
      prisma.attendance.count({
        where: { matchClubId: meta.id, playerId: { not: null }, isVote: true },
      }),
      prisma.attendance.count({
        where: { matchClubId: meta.id, playerId: { not: null }, isCheck: true },
      }),
      prisma.attendance.count({
        where: { matchClubId: meta.id, mercenaryId: { not: null }, isVote: true },
      }),
      prisma.attendance.count({
        where: { matchClubId: meta.id, mercenaryId: { not: null }, isCheck: true },
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
    where: { matchClubId: meta.id },
    update: totalsData,
    create: { matchClubId: meta.id, ...totalsData },
  });

  await upsertMatchClubTotalHistory(meta.id, meta.clubId, matchDate);
}

async function recalcAttendanceRatingVoteMigration(attendance: {
  id: string;
  matchClubId: string;
  player?: { userId: string | null } | null;
  mercenary?: { userId: string | null } | null;
}) {
  const userId = attendance.player?.userId ?? attendance.mercenary?.userId;
  if (!userId) return;

  const baseWhere: Prisma.EvaluationWhereInput = {
    userId,
    matchClubId: attendance.matchClubId,
    attendance: {
      NOT: [{ player: { userId } }, { mercenary: { userId } }],
    },
  };

  const aggregates = await prisma.evaluation.aggregate({
    where: baseWhere,
    _sum: { score: true },
    _count: { _all: true },
  });

  const usedLikeCount = await prisma.evaluation.count({
    where: { ...baseWhere, liked: true },
  });

  const votedMembers = await prisma.evaluation.findMany({
    where: baseWhere,
    select: { attendanceId: true },
  });
  const votedMemberCount = new Set(votedMembers.map((item) => item.attendanceId)).size;

  const totalUsedRating = aggregates._sum.score ?? 0;
  const hasVoted = (aggregates._count._all ?? 0) > 0;

  await prisma.attendanceRatingVote.upsert({
    where: { attendanceId: attendance.id },
    update: {
      totalUsedRating,
      hasVoted,
      votedMemberCount,
      usedLikeCount,
    },
    create: {
      attendanceId: attendance.id,
      totalUsedRating,
      hasVoted,
      votedMemberCount,
      usedLikeCount,
    },
  });
}

async function recalcAttendanceRatingStatsMigration(attendanceId: string) {
  const aggregates = await prisma.evaluation.aggregate({
    where: { attendanceId },
    _sum: { score: true },
    _count: { _all: true },
  });
  const likeCount = await prisma.evaluation.count({
    where: { attendanceId, liked: true },
  });

  const totalRating = aggregates._sum.score ?? 0;
  const voterCount = aggregates._count._all ?? 0;
  const averageRating = voterCount > 0 ? Math.round(totalRating / voterCount) : 0;

  await prisma.attendanceRatingStats.upsert({
    where: { attendanceId },
    update: {
      averageRating,
      totalRating,
      voterCount,
      likeCount,
    },
    create: {
      attendanceId,
      averageRating,
      totalRating,
      voterCount,
      likeCount,
    },
  });
}

export const statsMigration = async () => {
  console.log("⏳ [statsMigration] start");
  const processInBatches = async <T>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<void>,
  ) => {
    let processed = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      await Promise.all(slice.map((item) => fn(item)));
      processed += slice.length;
      console.log(`⏳ [statsMigration] processed ${processed}/${items.length}`);
    }
  };

  const matchClubs = await prisma.matchClub.findMany({
    include: { match: true },
  });
  const matchClubMeta: MatchClubMeta[] = matchClubs.map((mc) => ({
    id: mc.id,
    clubId: mc.clubId,
    matchDate: mc.match?.stDate ?? null,
  }));

  const attendances = await prisma.attendance.findMany({
    include: {
      matchClub: { include: { match: true } },
      player: { include: { user: true } },
      mercenary: { include: { user: true } },
    },
  });

  await processInBatches(attendances, 20, async (attendance) => {
    await recalcAttendanceRatingVoteMigration(attendance);
    await recalcAttendanceRatingStatsMigration(attendance.id);
  });

  const ratingStatsWithDate = await prisma.attendanceRatingStats.findMany({
    include: {
      attendance: {
        select: {
          id: true,
          matchClub: { select: { match: { select: { stDate: true } } } },
        },
      },
    },
  });

  const ratingStatsMeta = ratingStatsWithDate
    .map((rs) => {
      const matchDate = rs.attendance.matchClub.match?.stDate;
      if (!matchDate) return null;
      return {
        attendanceId: rs.attendanceId,
        averageRating: rs.averageRating,
        totalRating: rs.totalRating,
        matchDate: new Date(matchDate),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const buildHistory = (_attendanceId: string, matchDate: Date) => {
    const calc = (start: Date, end: Date) => {
      const stats = ratingStatsMeta.filter(
        (s) => s.matchDate.getTime() >= start.getTime() && s.matchDate.getTime() <= end.getTime(),
      );
      if (!stats.length) return { average: 0, total: 0, matchCount: 0 };
      const sums = stats.reduce(
        (acc, cur) => ({
          average: acc.average + cur.averageRating,
          total: acc.total + cur.totalRating,
          matchCount: acc.matchCount + 1,
        }),
        { average: 0, total: 0, matchCount: 0 },
      );
      const len = stats.length;
      return {
        average: Math.round(sums.average / len),
        total: Math.round(sums.total / len),
        matchCount: sums.matchCount,
      };
    };

    return {
      monthly: calc(startOfMonth(matchDate), matchDate),
      quarterly: calc(startOfQuarter(matchDate), matchDate),
      halfYear: calc(startOfHalfYear(matchDate), matchDate),
      yearly: calc(startOfYear(matchDate), matchDate),
    };
  };

  await processInBatches(ratingStatsMeta, 50, async ({ attendanceId, matchDate }) => {
    const { monthly, quarterly, halfYear, yearly } = buildHistory(attendanceId, matchDate);
    await prisma.attendanceRatingHistory.upsert({
      where: { attendanceId },
      update: {
        monthlyAverageRating: monthly.average,
        monthlyTotalRating: monthly.total,
        monthlyMatchCount: monthly.matchCount,
        quarterlyAverageRating: quarterly.average,
        quarterlyTotalRating: quarterly.total,
        quarterlyMatchCount: quarterly.matchCount,
        halfYearAverageRating: halfYear.average,
        halfYearTotalRating: halfYear.total,
        halfYearMatchCount: halfYear.matchCount,
        yearlyAverageRating: yearly.average,
        yearlyTotalRating: yearly.total,
        yearlyMatchCount: yearly.matchCount,
      },
      create: {
        attendanceId,
        monthlyAverageRating: monthly.average,
        monthlyTotalRating: monthly.total,
        monthlyMatchCount: monthly.matchCount,
        quarterlyAverageRating: quarterly.average,
        quarterlyTotalRating: quarterly.total,
        quarterlyMatchCount: quarterly.matchCount,
        halfYearAverageRating: halfYear.average,
        halfYearTotalRating: halfYear.total,
        halfYearMatchCount: halfYear.matchCount,
        yearlyAverageRating: yearly.average,
        yearlyTotalRating: yearly.total,
        yearlyMatchCount: yearly.matchCount,
      },
    });
  });

  await processInBatches(matchClubMeta, 20, async (meta) => recalcMatchClubStatistics(meta));

  console.log("✅ [statsMigration] completed");
};
