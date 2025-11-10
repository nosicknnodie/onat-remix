import type { MatchClubSummary } from "../isomorphic";
import type { summarizeMatch } from "../server/summary.service";

export type BaseSummary = {
  matchClubId: string;
  club: MatchClubSummary["club"];
  scoredBase: number;
  ownCommitted: number;
  attendance: MatchClubSummary["attendance"];
  mom?: MatchClubSummary["mom"];
};

export type MatchSummary = ReturnType<typeof summarizeMatch>;
