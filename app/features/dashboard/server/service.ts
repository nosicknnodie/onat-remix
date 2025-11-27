import dayjs from "dayjs";
import type { MatchClubWithSummaryRelations } from "~/features/matches/isomorphic";
import { summaryService } from "~/features/matches/server";
import type {
  DashboardData,
  DashboardMatchInsight,
  DashboardMom,
  DashboardPerformanceHistory,
  DashboardPlayerStatsHistory,
  DashboardPost,
} from "../isomorphic/types";
import * as q from "./queries";

type MatchClubWithMatch = MatchClubWithSummaryRelations & {
  match: {
    id: string;
    title: string;
    stDate: Date;
    placeName?: string | null;
  };
};

function groupMatchClubsByMatch(matchClubs: MatchClubWithMatch[]) {
  const groups = new Map<
    string,
    {
      match: MatchClubWithMatch["match"];
      matchClubs: MatchClubWithSummaryRelations[];
    }
  >();

  matchClubs.forEach((matchClub) => {
    const group = groups.get(matchClub.matchId) ?? {
      match: matchClub.match,
      matchClubs: [] as MatchClubWithSummaryRelations[],
    };
    group.matchClubs.push(matchClub);
    groups.set(matchClub.matchId, group);
  });

  return Array.from(groups.values());
}

function buildMatchInsights(
  grouped:
    | ReturnType<typeof groupMatchClubsByMatch>
    | Array<{
        match: { id: string; title: string; stDate: Date; placeName?: string | null };
        matchClubs: MatchClubWithSummaryRelations[];
      }>,
  userId: string,
): DashboardMatchInsight[] {
  const insights: DashboardMatchInsight[] = [];

  grouped.forEach(({ match, matchClubs }) => {
    const summaries = summaryService.summarizeMatchClubs(matchClubs);

    matchClubs.forEach((matchClub, index) => {
      const summary = summaries[index];
      if (!summary) return;
      const opponents = matchClubs
        .filter((candidate) => candidate.id !== matchClub.id)
        .map((candidate) => ({ clubName: candidate.club?.name ?? "" }));

      const userAttendance = matchClub.attendances.find(
        (attendance) =>
          attendance.player?.userId === userId || attendance.mercenary?.userId === userId,
      );

      insights.push({
        matchId: match.id,
        matchTitle: match.title,
        matchClubId: matchClub.id,
        stDate: match.stDate.toISOString(),
        placeName: match.placeName,
        clubName: matchClub.club?.name ?? "",
        clubId: matchClub.clubId,
        clubEmblemUrl: matchClub.club?.emblem?.url ?? null,
        opponents,
        summary,
        userAttendance: userAttendance
          ? {
              isVote: userAttendance.isVote,
              voteTime: userAttendance.voteTime?.toISOString() ?? null,
              isCheck: userAttendance.isCheck,
            }
          : undefined,
      });
    });
  });

  return insights;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const clubIds = await getApprovedClubIds(userId);
  const [todayMatches, upcomingAttendances, highlightPosts, weeklyMoms] = await Promise.all([
    getTodayMatchInsights(userId, clubIds),
    getUpcomingAttendanceInsights(userId, clubIds),
    getHighlightPostsData(userId, clubIds),
    getWeeklyMomHighlights(userId, clubIds),
  ]);

  return {
    todayMatches,
    upcomingAttendances,
    highlightPosts,
    weeklyMoms,
  };
}

async function getApprovedClubIds(userId: string, preset?: string[]) {
  if (preset) return preset;
  const players = await q.findApprovedPlayers(userId);
  return players.map((player) => player.clubId);
}

type MatchClubRangeArgs = {
  userId: string;
  clubIds: string[];
  start: Date;
  end: Date;
  query: typeof q.findMatchClubsInRange;
};

async function getInsightsByRange({
  userId,
  clubIds,
  start,
  end,
  query,
}: MatchClubRangeArgs): Promise<DashboardMatchInsight[]> {
  if (clubIds.length === 0) return [];
  const matchClubs = (await query({ clubIds, start, end })) as MatchClubWithMatch[];
  const grouped = groupMatchClubsByMatch(matchClubs);
  return buildMatchInsights(grouped, userId).sort(
    (a, b) => dayjs(a.stDate).valueOf() - dayjs(b.stDate).valueOf(),
  );
}

export async function getTodayMatchInsights(userId: string, presetClubIds?: string[]) {
  const now = dayjs();
  const start = now.startOf("day").toDate();
  const end = now.endOf("day").toDate();
  const clubIds = await getApprovedClubIds(userId, presetClubIds);

  return await getInsightsByRange({
    userId,
    clubIds,
    start,
    end,
    query: q.findUpcomingMatchClubs,
  });
}

export async function getUpcomingAttendanceInsights(userId: string, presetClubIds?: string[]) {
  const now = dayjs();
  const start = now.subtract(2, "hour").toDate();
  const end = now.add(14, "day").endOf("day").toDate();
  const clubIds = await getApprovedClubIds(userId, presetClubIds);
  const insights = await getInsightsByRange({
    userId,
    clubIds,
    start,
    end,
    query: q.findUpcomingMatchClubs,
  });

  return insights.filter(
    (insight) => dayjs(insight.stDate).isSame(now, "day") || dayjs(insight.stDate).isAfter(now),
  );
}

function buildWeeklyMomHighlights(matchClubs: MatchClubWithMatch[]): DashboardMom[] {
  const groupedWeek = groupMatchClubsByMatch(matchClubs);
  const weeklyMomMap = new Map<string, DashboardMom>();
  groupedWeek.forEach(({ match, matchClubs }) => {
    const summaries = summaryService.summarizeMatchClubs(matchClubs);
    matchClubs.forEach((matchClub, index) => {
      const summary = summaries[index];
      if (!summary?.mom) return;
      const existing = weeklyMomMap.get(matchClub.clubId);
      if (!existing || dayjs(match.stDate).isAfter(existing.stDate)) {
        weeklyMomMap.set(matchClub.clubId, {
          matchId: match.id,
          matchClubId: matchClub.id,
          stDate: match.stDate.toISOString(),
          clubName: matchClub.club?.name ?? "",
          mom: summary.mom,
        });
      }
    });
  });

  return Array.from(weeklyMomMap.values()).sort(
    (a, b) => dayjs(b.stDate).valueOf() - dayjs(a.stDate).valueOf(),
  );
}

export async function getWeeklyMomHighlights(userId: string, presetClubIds?: string[]) {
  const now = dayjs();
  const clubIds = await getApprovedClubIds(userId, presetClubIds);
  if (clubIds.length === 0) return [];
  const weekMatchClubs = (await q.findMatchClubsInRange({
    clubIds,
    start: now.startOf("week").toDate(),
    end: now.endOf("week").toDate(),
  })) as MatchClubWithMatch[];

  return buildWeeklyMomHighlights(weekMatchClubs);
}

export async function getHighlightPostsData(userId: string, presetClubIds?: string[]) {
  const clubIds = await getApprovedClubIds(userId, presetClubIds);
  const posts = await q.findHighlightPosts({ userId, clubIds, take: 8 });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    createdAt: post.createdAt.toISOString(),
    boardName: post.board?.name ?? null,
    clubName: post.board?.clubs?.name ?? null,
    boardSlug: post.board?.slug ?? null,
    boardClubId: post.board?.clubs?.id ?? null,
    isMine: post.authorId === userId,
  })) satisfies DashboardPost[];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export async function getPerformanceHistory(
  userId: string,
  year?: string,
): Promise<DashboardPerformanceHistory> {
  const players = await q.findApprovedPlayers(userId);
  if (players.length === 0) {
    const currentYear = dayjs().format("YYYY");
    return { members: [], availableYears: [currentYear], defaultYear: currentYear };
  }
  console.log("players - ", players);

  const targetYear = year ?? dayjs().format("YYYY");
  const history = await q.findPlayerStatsHistoryByYear({
    playerIds: players.map((p) => p.id),
    year: targetYear,
  });

  const memberMap = new Map<
    string,
    {
      clubId: string;
      clubName: string;
      clubEmblemUrl?: string | null;
      playerId: string;
      history: DashboardPlayerStatsHistory[];
    }
  >();

  players.forEach((player) => {
    memberMap.set(player.id, {
      clubId: player.clubId,
      clubName: player.club?.name ?? "",
      clubEmblemUrl: player.club?.emblem?.url ?? null,
      playerId: player.id,
      history: [],
    });
  });

  history.forEach((item) => {
    const member = memberMap.get(item.playerId);
    if (!member) return;
    member.history.push({
      id: item.id,
      playerId: item.playerId,
      periodType: item.periodType,
      periodKey: item.periodKey,
      averageRating: toNumber(item.averageRating),
      voteRate: toNumber(item.voteRate),
      totalRating: toNumber(item.totalRating),
      totalGoal: toNumber(item.totalGoal),
      totalAssist: toNumber(item.totalAssist),
      totalLike: toNumber(item.totalLike),
      matchCount: toNumber(item.matchCount),
    });
  });

  const availableYears = Array.from(
    new Set(history.map((h) => h.periodKey.slice(0, 4)).filter(Boolean)),
  );
  const defaultYear = targetYear;

  return {
    members: Array.from(memberMap.values()),
    availableYears: availableYears.length > 0 ? availableYears : [defaultYear],
    defaultYear,
  };
}
