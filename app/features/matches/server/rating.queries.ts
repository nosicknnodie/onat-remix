import { Prisma, type StatsPeriodType } from "@prisma/client";
import { prisma } from "~/libs/server/db/db";
import type { RatingRegisterAttendanceRaw } from "../isomorphic/rating.types";

export async function findMatchClubWithQuarters(matchClubId: string) {
  return await prisma.matchClub.findFirst({
    where: { id: matchClubId, isUse: true },
    include: { quarters: { include: { team1: true, team2: true } } },
  });
}

type RatingAttendance = Prisma.AttendanceGetPayload<{
  include: {
    evaluations: true;
    records: { where: { isOwnGoal: false } };
    assigneds: true;
    player: { include: { user: { include: { userImage: true } } } };
    mercenary: { include: { user: { include: { userImage: true } } } };
  };
}>;

export async function getRatingAttendances({ matchClubId }: { matchClubId: string }) {
  const attendances = await prisma.attendance.findMany({
    where: { matchClubId, isVote: true },
    include: {
      evaluations: true,
      records: { where: { isOwnGoal: false } },
      assigneds: true,
      player: { include: { user: { include: { userImage: true } } } },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return attendances as RatingAttendance[];
}

export async function getRatingRegisterAttendances({
  matchClubId,
  userId,
}: {
  matchClubId: string;
  userId: string;
}) {
  const attendances = await prisma.attendance.findMany({
    where: { matchClubId },
    include: {
      records: {
        where: { isOwnGoal: false },
        include: {
          quarter: true,
          team: true,
          assistAttendance: {
            include: {
              player: { include: { user: { include: { userImage: true } } } },
              mercenary: { include: { user: { include: { userImage: true } } } },
            },
          },
        },
      },
      assigneds: {
        include: {
          quarter: true,
          team: true,
        },
      },
      player: { include: { user: { include: { userImage: true } } } },
      mercenary: { include: { user: { include: { userImage: true } } } },
      evaluations: {
        where: { userId },
        select: {
          id: true,
          score: true,
          liked: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
  return attendances as RatingRegisterAttendanceRaw[];
}

export async function getRatingStats(matchClubId: string) {
  return await prisma.attendanceRatingStats.findMany({
    where: { attendance: { matchClubId } },
    include: {
      attendance: {
        include: {
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
    },
    orderBy: [{ averageRating: "desc" }, { totalRating: "desc" }, { voterCount: "desc" }],
  });
}

export async function upsertScoreEvaluation(
  userId: string,
  input: { attendanceId: string; matchClubId: string; score: number },
) {
  return await prisma.evaluation.upsert({
    create: { ...input, userId },
    update: { score: input.score },
    where: {
      userId_matchClubId_attendanceId: {
        userId,
        matchClubId: input.matchClubId,
        attendanceId: input.attendanceId,
      },
    },
  });
}
export async function upsertLikeEvaluation(
  userId: string,
  input: { attendanceId: string; matchClubId: string; liked: boolean },
) {
  return await prisma.evaluation.upsert({
    create: { ...input, userId },
    update: { liked: input.liked },
    where: {
      userId_matchClubId_attendanceId: {
        userId,
        matchClubId: input.matchClubId,
        attendanceId: input.attendanceId,
      },
    },
  });
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfQuarter = (date: Date) =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
const startOfHalfYear = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() < 6 ? 0 : 6, 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const endOfQuarter = (date: Date) =>
  new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999);
const endOfHalfYear = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() < 6 ? 6 : 12, 0, 23, 59, 59, 999);
const endOfYear = (date: Date) => new Date(date.getFullYear(), 12, 0, 23, 59, 59, 999);

async function getAttendanceForHistory(attendanceId: string) {
  return prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: {
      id: true,
      playerId: true,
      mercenaryId: true,
      matchClub: {
        select: {
          match: { select: { stDate: true } },
        },
      },
    },
  });
}

async function calculateRangeStats(start: Date, end: Date, playerId: string) {
  const cappedEnd = end > new Date() ? new Date() : end;
  const matchFilter = {
    match: {
      stDate: {
        gte: start,
        lte: cappedEnd,
      },
    },
  } as const;

  const playerClub = await prisma.player.findUnique({
    where: { id: playerId },
    select: { clubId: true },
  });

  const [ratingStats, _attendanceCount, voteCount, goalCount, assistCount, likeCount] =
    await Promise.all([
      prisma.attendanceRatingStats.findMany({
        where: {
          attendance: {
            playerId,
            matchClub: {
              ...matchFilter,
              clubId: playerClub?.clubId,
            },
          },
        },
        select: { averageRating: true },
      }),
      prisma.attendance.count({
        where: {
          playerId,
          matchClub: {
            ...matchFilter,
            clubId: playerClub?.clubId,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          playerId,
          isVote: true,
          matchClub: {
            ...matchFilter,
            clubId: playerClub?.clubId,
          },
        },
      }),
      prisma.record.count({
        where: {
          attendance: {
            playerId,
            matchClub: {
              ...matchFilter,
              clubId: playerClub?.clubId,
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
              clubId: playerClub?.clubId,
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
              clubId: playerClub?.clubId,
            },
          },
        },
      }),
    ]);

  const total = ratingStats.reduce(
    (acc: number, current) => acc + Number(current.averageRating ?? 0),
    0,
  );
  const average = ratingStats.length ? total / ratingStats.length : 0;
  const clubMatchCount = await prisma.matchClub.count({
    where: {
      clubId: playerClub?.clubId ?? "",
      match: {
        ...matchFilter.match,
      },
    },
  });

  const voteRate = clubMatchCount > 0 ? Math.round((voteCount / clubMatchCount) * 100) : 0;

  return {
    average,
    total,
    matchCount: voteCount,
    totalGoal: goalCount,
    totalAssist: assistCount,
    totalLike: likeCount,
    voteRate,
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

async function upsertPlayerStatsHistory(attendanceId: string) {
  const attendance = await getAttendanceForHistory(attendanceId);
  if (!attendance || !attendance.matchClub.match?.stDate) return;
  const { playerId } = attendance;
  if (!playerId) return;
  const matchDate = attendance.matchClub.match.stDate;
  const now = new Date();

  const periods: Array<{ type: StatsPeriodType; start: Date; end: Date }> = [
    {
      type: "MONTH",
      start: startOfMonth(matchDate),
      end: endOfMonth(matchDate),
    },
    {
      type: "QUARTER",
      start: startOfQuarter(matchDate),
      end: endOfQuarter(matchDate),
    },
    {
      type: "HALF_YEAR",
      start: startOfHalfYear(matchDate),
      end: endOfHalfYear(matchDate),
    },
    {
      type: "YEAR",
      start: startOfYear(matchDate),
      end: endOfYear(matchDate),
    },
  ];

  const histories = await Promise.all(
    periods.map(async (period) => {
      const cappedEnd = period.end > now ? now : period.end;
      const range = await calculateRangeStats(period.start, cappedEnd, playerId);
      return {
        ...range,
        periodType: period.type,
        periodKey: formatPeriodKey(matchDate, period.type),
      };
    }),
  );

  await prisma.$transaction(
    histories.map((history) =>
      prisma.playerStatsHistory.upsert({
        where: {
          playerId_periodType_periodKey: {
            playerId,
            periodType: history.periodType,
            periodKey: history.periodKey,
          },
        },
        update: {
          averageRating: new Prisma.Decimal(history.average),
          totalRating: new Prisma.Decimal(history.total),
          matchCount: history.matchCount,
          totalGoal: history.totalGoal,
          totalAssist: history.totalAssist,
          totalLike: history.totalLike,
          voteRate: history.voteRate,
        },
        create: {
          playerId,
          periodType: history.periodType,
          periodKey: history.periodKey,
          averageRating: new Prisma.Decimal(history.average),
          totalRating: new Prisma.Decimal(history.total),
          matchCount: history.matchCount,
          totalGoal: history.totalGoal,
          totalAssist: history.totalAssist,
          totalLike: history.totalLike,
          voteRate: history.voteRate,
        },
      }),
    ),
  );
}

export async function recalcPlayerStatsHistoryByAttendance(attendanceId: string) {
  await upsertPlayerStatsHistory(attendanceId);
}

export async function recalcAttendanceRatingStats(attendanceId: string) {
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
  const averageRating = voterCount > 0 ? totalRating / voterCount : 0;
  const totalRatingForStore = totalRating;

  await prisma.attendanceRatingStats.upsert({
    where: { attendanceId },
    update: {
      averageRating: new Prisma.Decimal(averageRating),
      totalRating: new Prisma.Decimal(totalRatingForStore),
      voterCount,
      likeCount,
    },
    create: {
      attendanceId,
      averageRating: new Prisma.Decimal(averageRating),
      totalRating: new Prisma.Decimal(totalRatingForStore),
      voterCount,
      likeCount,
    },
  });

  await upsertPlayerStatsHistory(attendanceId);
}

export async function recalcAttendanceRatingVote(userId: string, matchClubId: string) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      matchClubId,
      OR: [{ player: { userId } }, { mercenary: { userId } }],
    },
    select: { id: true },
  });
  if (!attendance) return;

  const baseWhere: Prisma.EvaluationWhereInput = {
    userId,
    matchClubId,
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

export const updateSeeds = async (matchClubId: string, userId: string, myAttendanceId: string) => {
  const targetAttendances = await prisma.attendance.findMany({
    where: {
      matchClubId,
      isVote: true,
      player: { status: "APPROVED" },
    },
    select: { id: true, playerId: true },
  });
  const resolveEvaluations = targetAttendances.map((att) => {
    return {
      userId,
      matchClubId,
      attendanceId: att.id,
      score: att.id === myAttendanceId ? 100 : 60,
      liked: false,
    };
  });
  await prisma.$transaction(async (tx) => {
    await tx.evaluation.deleteMany({
      where: {
        userId,
        matchClubId,
      },
    });
    await tx.evaluation.createMany({
      data: resolveEvaluations,
    });

    await tx.attendanceRatingVote.upsert({
      where: { attendanceId: myAttendanceId },
      update: {
        hasVoted: true,
        totalUsedRating: resolveEvaluations.reduce((sum, att) => sum + att.score, 0),
        votedMemberCount: resolveEvaluations.length,
      },
      create: {
        attendanceId: myAttendanceId,
        hasVoted: true,
        totalUsedRating: resolveEvaluations.reduce((sum, att) => sum + att.score, 0),
        votedMemberCount: resolveEvaluations.length,
      },
    });

    const attendanceIds = targetAttendances.map((att) => att.id);
    if (attendanceIds.length > 0) {
      const evalAgg = await tx.evaluation.groupBy({
        by: ["attendanceId"],
        where: { attendanceId: { in: attendanceIds } },
        _sum: { score: true },
        _count: { _all: true },
      });
      const likeAgg = await tx.evaluation.groupBy({
        by: ["attendanceId"],
        where: { attendanceId: { in: attendanceIds }, liked: true },
        _count: { _all: true },
      });
      const likeMap = new Map(likeAgg.map((item) => [item.attendanceId, item._count._all ?? 0]));

      for (const agg of evalAgg) {
        const likeCount = likeMap.get(agg.attendanceId) ?? 0;
        const voterCount = agg._count._all ?? 0;
        const totalRating = agg._sum.score ?? 0;
        await tx.attendanceRatingStats.upsert({
          where: { attendanceId: agg.attendanceId },
          update: {
            averageRating: voterCount > 0 ? Math.round(totalRating / voterCount) : 0,
            totalRating,
            voterCount,
            likeCount,
          },
          create: {
            attendanceId: agg.attendanceId,
            averageRating: voterCount > 0 ? Math.round(totalRating / voterCount) : 0,
            totalRating,
            voterCount,
            likeCount,
          },
        });
      }
    }
  });
  await recalcAttendanceRatingVote(userId, matchClubId);
};
