import type { MatchSummary } from "./summary.types";
import type { MatchClubSummary, MatchClubWithSummaryRelations } from "./types";

export type MatchClubQueryResponse = {
  matchClub: MatchClubWithSummaryRelations | null;
  summary: MatchClubSummary | null;
  matchSummary: MatchSummary | null;
};

export type MatchClubLayoutResponse = MatchClubQueryResponse & {
  matchSummary: MatchSummary;
};
