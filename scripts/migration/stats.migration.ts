import type { Prisma, StatsPeriodType } from "@prisma/client";
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
    default:
      return `${year}`;
  }
};

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
    const endCap = end > new Date() ? new Date() : end;
    const totals = await prisma.matchClubStatsTotal.findMany({
      where: {
        matchClub: {
          clubId,
          match: {
            stDate: {
              gte: start,
              lte: endCap,
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

  const periods: Array<{ type: StatsPeriodType; start: Date }> = [
    { type: "MONTH", start: startOfMonth(matchDate) },
    { type: "QUARTER", start: startOfQuarter(matchDate) },
    { type: "HALF_YEAR", start: startOfHalfYear(matchDate) },
    { type: "YEAR", start: startOfYear(matchDate) },
  ];

  const histories = await Promise.all(
    periods.map(async (period) => {
      const history = await calculateHistoryAverage(period.start, matchDate);
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

async function calculatePlayerRangeStats(
  playerId: string,
  start: Date,
  end: Date,
): Promise<{
  average: number;
  total: number;
  matchCount: number;
  totalGoal: number;
  totalAssist: number;
  totalLike: number;
  voteRate: number;
}> {
  const cappedEnd = end > new Date() ? new Date() : end;
  const matchFilter = {
    match: {
      stDate: {
        gte: start,
        lte: cappedEnd,
      },
    },
  } as const;

  const [ratingStats, matchCount, goalCount, assistCount, likeCount, voteCount] = await Promise.all(
    [
      prisma.attendanceRatingStats.findMany({
        where: {
          attendance: {
            playerId,
            matchClub: {
              ...matchFilter,
            },
          },
        },
        select: { averageRating: true },
      }),
      prisma.attendance.count({
        where: {
          playerId,
          isVote: true,
          matchClub: {
            ...matchFilter,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          playerId,
          isVote: true,
          matchClub: {
            ...matchFilter,
          },
        },
      }),
      prisma.record.count({
        where: {
          attendance: {
            playerId,
            matchClub: {
              ...matchFilter,
            },
          },
          eventType: { in: ["GOAL", "PK_GOAL"] },
          isOwnGoal: false,
        },
      }),
      prisma.record.count({
        where: {
          assistAttendance: {
            playerId,
            matchClub: {
              ...matchFilter,
            },
          },
        },
      }),
      prisma.evaluation.count({
        where: {
          liked: true,
          attendance: {
            playerId,
            matchClub: {
              ...matchFilter,
            },
          },
        },
      }),
    ],
  );

  const validStats = ratingStats.filter((stat) => stat.averageRating > 0);
  const total = validStats.reduce((acc, current) => acc + current.averageRating, 0);
  const average = validStats.length ? Math.round(total / validStats.length) : 0;
  const voteRate = matchCount > 0 ? Math.round((voteCount / matchCount) * 100) : 0;

  return {
    average,
    total,
    matchCount,
    totalGoal: goalCount,
    totalAssist: assistCount,
    totalLike: likeCount,
    voteRate,
  };
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

  const periods: StatsPeriodType[] = ["MONTH", "QUARTER", "HALF_YEAR", "YEAR"];
  const playerIds = Array.from(
    new Set(
      attendances
        .map((a) => (a.playerId && a.matchClub.match?.stDate ? a.playerId : null))
        .filter(Boolean) as string[],
    ),
  );

  const lastMatchDateByPlayer = new Map<string, Date>();
  attendances.forEach((a) => {
    if (!a.playerId || !a.matchClub.match?.stDate) return;
    const date = new Date(a.matchClub.match.stDate);
    const prev = lastMatchDateByPlayer.get(a.playerId);
    if (!prev || date.getTime() > prev.getTime()) lastMatchDateByPlayer.set(a.playerId, date);
  });

  await processInBatches(playerIds, 20, async (playerId) => {
    const lastMatchDate = lastMatchDateByPlayer.get(playerId);
    if (!lastMatchDate) return;

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const periodType of periods) {
      const start = (() => {
        switch (periodType) {
          case "MONTH":
            return startOfMonth(lastMatchDate);
          case "QUARTER":
            return startOfQuarter(lastMatchDate);
          case "HALF_YEAR":
            return startOfHalfYear(lastMatchDate);
          default:
            return startOfYear(lastMatchDate);
        }
      })();

      const history = await calculatePlayerRangeStats(playerId, start, lastMatchDate);
      const periodKey = formatPeriodKey(lastMatchDate, periodType);

      ops.push(
        prisma.playerStatsHistory.upsert({
          where: {
            playerId_periodType_periodKey: {
              playerId,
              periodType,
              periodKey,
            },
          },
          update: {
            averageRating: history.average,
            totalRating: history.total,
            matchCount: history.matchCount,
            totalGoal: history.totalGoal,
            totalAssist: history.totalAssist,
            totalLike: history.totalLike,
            voteRate: history.voteRate,
          },
          create: {
            playerId,
            periodType,
            periodKey,
            averageRating: history.average,
            totalRating: history.total,
            matchCount: history.matchCount,
            totalGoal: history.totalGoal,
            totalAssist: history.totalAssist,
            totalLike: history.totalLike,
            voteRate: history.voteRate,
          },
        }),
      );
    }

    if (ops.length) {
      await prisma.$transaction(ops);
    }
  });

  await processInBatches(matchClubMeta, 20, async (meta) => recalcMatchClubStatistics(meta));

  console.log("✅ [statsMigration] completed");
};
