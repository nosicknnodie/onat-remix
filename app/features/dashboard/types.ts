import type { MatchClubSummary } from "~/features/matches/types";

export type DashboardMatchInsight = {
  matchId: string;
  matchClubId: string;
  matchTitle: string;
  stDate: string;
  placeName?: string | null;
  clubName: string;
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
