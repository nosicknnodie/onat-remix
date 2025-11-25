import type { Prisma, StatsPeriodType } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";
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
  const total = validStats.reduce((acc: number, current) => acc + current.averageRating, 0);
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

  const periods: Array<{ type: StatsPeriodType; start: Date }> = [
    { type: "MONTH", start: startOfMonth(matchDate) },
    { type: "QUARTER", start: startOfQuarter(matchDate) },
    { type: "HALF_YEAR", start: startOfHalfYear(matchDate) },
    { type: "YEAR", start: startOfYear(matchDate) },
  ];

  const histories = await Promise.all(
    periods.map(async (period) => {
      const range = await calculateRangeStats(period.start, matchDate, playerId);
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
          periodType: history.periodType,
          periodKey: history.periodKey,
          averageRating: history.average,
          totalRating: history.total,
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
  const hasEnoughVoters = voterCount >= 3;
  const ratingVote = await prisma.attendanceRatingVote.findUnique({
    where: { attendanceId },
    select: { hasVoted: true },
  });
  const forceSelfScore = ratingVote?.hasVoted ?? false;
  const computedAverage =
    hasEnoughVoters && voterCount > 0 ? Math.round(totalRating / voterCount) : 0;
  const computedTotal = hasEnoughVoters ? totalRating : 0;
  // 본인 투표 여부(hasVoted)에 따라 자기 평점을 60점으로 강제 저장한다.
  const averageRating = forceSelfScore ? 60 : computedAverage;
  const totalRatingForStore = forceSelfScore ? 60 : computedTotal;

  await prisma.attendanceRatingStats.upsert({
    where: { attendanceId },
    update: {
      averageRating,
      totalRating: totalRatingForStore,
      voterCount,
      likeCount,
    },
    create: {
      attendanceId,
      averageRating,
      totalRating: totalRatingForStore,
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

  const existingVote = await prisma.attendanceRatingVote.findUnique({
    where: { attendanceId: attendance.id },
    select: { hasVoted: true },
  });

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

  if (hasVoted && !existingVote?.hasVoted) {
    // 타인에게 첫 투표를 완료한 순간 자신의 Evaluation에 60점을 기록하고 통계를 갱신한다.
    await prisma.evaluation.upsert({
      where: {
        userId_matchClubId_attendanceId: {
          userId,
          matchClubId,
          attendanceId: attendance.id,
        },
      },
      update: { score: 60 },
      create: {
        userId,
        matchClubId,
        attendanceId: attendance.id,
        score: 60,
        liked: false,
      },
    });
    await recalcAttendanceRatingStats(attendance.id);
  }
}
