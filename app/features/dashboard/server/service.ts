import dayjs from "dayjs";
import type { MatchClubWithSummaryRelations } from "~/features/matches/isomorphic";
import { summaryService } from "~/features/matches/server";
import type {
  DashboardData,
  DashboardMatchInsight,
  DashboardMom,
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
  const players = await q.findApprovedPlayers(userId);
  const clubIds = players.map((player) => player.clubId);

  const now = dayjs();
  const startOfToday = now.startOf("day").toDate();
  const upcomingRangeEnd = now.add(14, "day").endOf("day").toDate();
  const weekStart = now.startOf("week").toDate();
  const weekEnd = now.endOf("week").toDate();

  const [upcomingMatchClubs, weekMatchClubs, posts] = await Promise.all([
    q.findUpcomingMatchClubs({ clubIds, start: startOfToday, end: upcomingRangeEnd }),
    q.findMatchClubsInRange({ clubIds, start: weekStart, end: weekEnd }),
    q.findHighlightPosts({ userId, clubIds, take: 8 }),
  ]);

  const groupedUpcoming = groupMatchClubsByMatch(upcomingMatchClubs as MatchClubWithMatch[]);
  const upcomingInsights = buildMatchInsights(groupedUpcoming, userId).sort(
    (a, b) => dayjs(a.stDate).valueOf() - dayjs(b.stDate).valueOf(),
  );

  const todayMatches = upcomingInsights.filter((insight) =>
    dayjs(insight.stDate).isSame(now, "day"),
  );

  const upcomingAttendances = upcomingInsights.filter(
    (insight) => dayjs(insight.stDate).isSame(now, "day") || dayjs(insight.stDate).isAfter(now),
  );

  const groupedWeek = groupMatchClubsByMatch(weekMatchClubs as MatchClubWithMatch[]);
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

  const weeklyMoms = Array.from(weeklyMomMap.values()).sort(
    (a, b) => dayjs(b.stDate).valueOf() - dayjs(a.stDate).valueOf(),
  );

  const highlightPosts: DashboardPost[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    createdAt: post.createdAt.toISOString(),
    boardName: post.board?.name ?? null,
    clubName: post.board?.clubs?.name ?? null,
    boardSlug: post.board?.slug ?? null,
    boardClubId: post.board?.clubs?.id ?? null,
    isMine: post.authorId === userId,
  }));

  return {
    todayMatches,
    upcomingAttendances,
    highlightPosts,
    weeklyMoms,
  };
}
