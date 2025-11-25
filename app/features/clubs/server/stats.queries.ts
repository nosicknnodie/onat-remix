import { prisma } from "~/libs/db/db.server";

type PlayerYearStat = {
  playerId: string;
  nick: string | null;
  userImageUrl: string | null;
  averageRating: number;
  totalGoal: number;
  totalLike: number;
  matchCount: number;
  attendanceRate: number;
};

export async function getClubYearStats(input: {
  clubId: string;
  year: number;
}): Promise<PlayerYearStat[]> {
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

  const filtered: PlayerYearStat[] = yearlyStats
    .map((s) => {
      const matchCount = attendanceCountMap.get(s.playerId) ?? 0;
      const attendanceRate =
        clubMatchCount > 0 ? Math.round((matchCount / clubMatchCount) * 100) : 0;
      return {
        playerId: s.playerId,
        nick: s.player?.nick ?? null,
        userImageUrl: s.player?.user?.userImage?.url ?? null,
        averageRating: s.averageRating ?? 0,
        totalGoal: s.totalGoal ?? 0,
        totalLike: s.totalLike ?? 0,
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

  const top = await prisma.attendanceRatingStats.findFirst({
    where: {
      attendance: {
        playerId: { not: null },
        matchClub: { clubId, match: { stDate: { gte: weekAgo, lt: now } } },
      },
    },
    orderBy: { averageRating: "desc" },
    include: {
      attendance: {
        select: {
          playerId: true,
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

  if (!top) return null;

  return {
    playerId: top.attendance.playerId!,
    nick: top.attendance.player?.nick ?? null,
    userImageUrl: top.attendance.player?.user?.userImage?.url ?? null,
    averageRating: top.averageRating,
  };
}
