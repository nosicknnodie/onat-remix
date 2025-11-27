import type { MatchClubSummary } from "~/features/matches/isomorphic";

export type DashboardMatchInsight = {
  matchId: string;
  matchClubId: string;
  matchTitle: string;
  stDate: string;
  placeName?: string | null;
  clubName: string;
  clubId: string;
  clubEmblemUrl?: string | null;
  opponents: Array<{ clubName: string }>;
  summary: MatchClubSummary;
  userAttendance?: {
    isVote: boolean;
    voteTime?: string | null;
    isCheck: boolean;
  };
};

export type DashboardPost = {
  id: string;
  title: string;
  createdAt: string;
  boardName?: string | null;
  clubName?: string | null;
  boardSlug?: string | null;
  boardClubId?: string | null;
  isMine: boolean;
};

export type DashboardMom = {
  matchId: string;
  matchClubId: string;
  stDate: string;
  clubName: string;
  mom: NonNullable<MatchClubSummary["mom"]>;
};

export type DashboardData = {
  todayMatches: DashboardMatchInsight[];
  upcomingAttendances: DashboardMatchInsight[];
  highlightPosts: DashboardPost[];
  weeklyMoms: DashboardMom[];
};

export type DashboardMembership = {
  clubId: string;
  clubName: string;
  clubEmblemUrl?: string | null;
  playerId: string;
};

export type DashboardPlayerStatsHistory = {
  id: string;
  playerId: string;
  periodType: string;
  periodKey: string;
  averageRating: number | null;
  voteRate: number | null;
  totalRating: number | null;
  totalGoal: number | null;
  totalAssist: number | null;
  totalLike: number | null;
  matchCount: number | null;
};

export type DashboardPerformanceHistory = {
  members: Array<DashboardMembership & { history: DashboardPlayerStatsHistory[] }>;
  availableYears: string[];
  defaultYear: string;
};
