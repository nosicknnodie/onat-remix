import { prisma } from "~/libs/server/db/db";

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

type PlayerYearStat = {
  playerId: string;
  nick: string | null;
  userImageUrl: string | null;
  averageRating: number | null;
  totalGoal: number;
  totalLike: number | null;
  totalRating: number | null;
};

type ClubYearStatItem = {
  playerId: string;
  nick: string | null;
  userImageUrl: string | null;
  averageRating: number | null;
  totalGoal: number;
  totalLike: number | null;
  totalRating: number | null;
  matchCount: number;
  attendanceRate: number;
};

export async function getClubYearStats(input: {
  clubId: string;
  year: number;
}): Promise<PlayerYearStat[]> {
  const { clubId, year } = input;
  const yearKey = `${year}`;
  // const now = new Date();
  // const start = new Date(year, 0, 1);
  // const end = new Date(year + 1, 0, 1);
  const yearlyStats = await prisma.playerStatsHistory.findMany({
    where: {
      player: { clubId, status: "APPROVED" },
      periodType: "YEAR",
      periodKey: yearKey,
    },
    select: {
      playerId: true,
      averageRating: true,
      totalGoal: true,
      totalLike: true,
      totalRating: true,
      matchCount: true,
      voteRate: true,
      player: {
        select: { nick: true, user: { select: { userImage: { select: { url: true } } } } },
      },
    },
  });
  return yearlyStats.map((stat) => ({
    playerId: stat.playerId,
    nick: stat.player?.nick ?? null,
    userImageUrl: stat.player?.user?.userImage?.url ?? null,
    averageRating: toNullableNumber(stat.averageRating),
    totalGoal: Number(stat.totalGoal ?? 0),
    totalLike: toNullableNumber(stat.totalLike),
    totalRating: toNullableNumber(stat.totalRating),
  }));
}

export async function getClubYearMainStats(input: {
  clubId: string;
  year: number;
}): Promise<ClubYearStatItem[]> {
  const { clubId, year } = input;
  const yearKey = `${year}`;
  const now = new Date();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [yearlyStats, clubMatchCount, attendanceCounts] = await Promise.all([
    prisma.playerStatsHistory.findMany({
      where: {
        player: { clubId, status: "APPROVED" },
        periodType: "YEAR",
        periodKey: yearKey,
      },
      select: {
        playerId: true,
        averageRating: true,
        totalGoal: true,
        totalLike: true,
        totalRating: true,
        matchCount: true,
        voteRate: true,
        player: {
          select: { nick: true, user: { select: { userImage: { select: { url: true } } } } },
        },
      },
    }),
    prisma.matchClub.count({
      where: { clubId, match: { stDate: { gte: start, lt: end, lte: now } } },
    }),
    prisma.attendance.groupBy({
      by: ["playerId"],
      where: {
        playerId: { not: null },
        isVote: true,
        matchClub: { clubId, match: { stDate: { gte: start, lt: end, lte: now } } },
      },
      _count: { _all: true },
    }),
  ]);

  const attendanceCountMap = new Map<string, number>();
  attendanceCounts.forEach((item) => {
    if (item.playerId) attendanceCountMap.set(item.playerId, item._count._all ?? 0);
  });

  const filtered: ClubYearStatItem[] = yearlyStats
    .map((s) => {
      const matchCount = attendanceCountMap.get(s.playerId) ?? 0;
      const attendanceRate =
        clubMatchCount > 0 ? Math.round((matchCount / clubMatchCount) * 100) : 0;
      return {
        playerId: s.playerId,
        nick: s.player?.nick ?? null,
        userImageUrl: s.player?.user?.userImage?.url ?? null,
        averageRating: toNullableNumber(s.averageRating),
        totalGoal: s.totalGoal ?? 0,
        totalLike: toNullableNumber(s.totalLike),
        totalRating: toNullableNumber(s.totalRating),
        matchCount,
        attendanceRate,
      };
    })
    .filter((p) => p.attendanceRate >= 25);

  return filtered;
}

export async function getWeeklyTopRating(clubId: string) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const tops = await prisma.attendanceRatingStats.findMany({
    where: {
      attendance: {
        playerId: { not: null },
        matchClub: { clubId, match: { stDate: { gte: weekAgo, lt: now } } },
      },
    },
    orderBy: [{ averageRating: "desc" }, { totalRating: "desc" }, { voterCount: "desc" }],
    take: 5,
    include: {
      attendance: {
        select: {
          playerId: true,
          matchClubId: true,
          matchClub: { select: { match: { select: { stDate: true } } } },
          player: {
            select: {
              nick: true,
              user: { select: { userImage: { select: { url: true } } } },
            },
          },
        },
      },
    },
  });

  if (!tops || tops.length === 0) return [];

  const topByMatch = new Map<string, (typeof tops)[number]>();
  tops.forEach((item) => {
    const matchClubId = item.attendance.matchClubId;
    if (!matchClubId || topByMatch.has(matchClubId)) return;
    topByMatch.set(matchClubId, item);
  });

  return Array.from(topByMatch.values()).map((top) => ({
    playerId: top.attendance.playerId!,
    matchClubId: top.attendance.matchClubId,
    matchDate: top.attendance.matchClub?.match?.stDate?.toISOString() ?? null,
    nick: top.attendance.player?.nick ?? null,
    userImageUrl: top.attendance.player?.user?.userImage?.url ?? null,
    averageRating: toNullableNumber(top.averageRating),
  }));
}
