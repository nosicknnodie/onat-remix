import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

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

async function calculateRangeRating(start: Date, end: Date, filter: Prisma.AttendanceWhereInput) {
  const stats = await prisma.attendanceRatingStats.findMany({
    where: {
      attendance: {
        ...filter,
        matchClub: {
          match: {
            stDate: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    },
    select: { averageRating: true, voterCount: true },
  });
  const validStats = stats.filter((stat) => stat.averageRating > 0);
  if (!validStats.length) {
    return { average: 0, total: 0 };
  }
  const total = validStats.reduce((acc: number, current) => acc + current.averageRating, 0);
  const average = Math.round(total / validStats.length);
  return { average, total };
}

async function upsertAttendanceRatingHistory(attendanceId: string) {
  const attendance = await getAttendanceForHistory(attendanceId);
  if (!attendance || !attendance.matchClub.match?.stDate) return;
  const { playerId, mercenaryId } = attendance;
  if (!playerId && !mercenaryId) return;
  const matchDate = attendance.matchClub.match.stDate;

  const filter: Prisma.AttendanceWhereInput = {};
  if (playerId) {
    filter.playerId = playerId;
  } else if (mercenaryId) {
    filter.mercenaryId = mercenaryId;
  }

  const [monthly, quarterly, halfYear, yearly] = await Promise.all([
    calculateRangeRating(startOfMonth(matchDate), matchDate, filter),
    calculateRangeRating(startOfQuarter(matchDate), matchDate, filter),
    calculateRangeRating(startOfHalfYear(matchDate), matchDate, filter),
    calculateRangeRating(startOfYear(matchDate), matchDate, filter),
  ]);

  await prisma.attendanceRatingHistory.upsert({
    where: { attendanceId },
    update: {
      monthlyAverageRating: monthly.average,
      monthlyTotalRating: monthly.total,
      quarterlyAverageRating: quarterly.average,
      quarterlyTotalRating: quarterly.total,
      halfYearAverageRating: halfYear.average,
      halfYearTotalRating: halfYear.total,
      yearlyAverageRating: yearly.average,
      yearlyTotalRating: yearly.total,
    },
    create: {
      attendanceId,
      monthlyAverageRating: monthly.average,
      monthlyTotalRating: monthly.total,
      quarterlyAverageRating: quarterly.average,
      quarterlyTotalRating: quarterly.total,
      halfYearAverageRating: halfYear.average,
      halfYearTotalRating: halfYear.total,
      yearlyAverageRating: yearly.average,
      yearlyTotalRating: yearly.total,
    },
  });
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

  await upsertAttendanceRatingHistory(attendanceId);
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
