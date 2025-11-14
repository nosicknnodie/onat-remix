import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { MatchSummary } from "./summary.types";

export const matchSummaryQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "match", "summary"] as const,
} as const;

export const matchDetailQueryKeys = {
  detail: (matchId: string) => ["match", matchId, "detail"] as const,
} as const;

export type UseMatchSummaryQueryOptions = {
  enabled?: boolean;
  initialData?: MatchSummary;
};

export function useMatchSummaryQuery(matchClubId?: string, options?: UseMatchSummaryQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => matchSummaryQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<MatchSummary>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch match summary");
      }
      return getJson<MatchSummary>(`/api/matchClubs/${matchClubId}/summary`, { auth: true });
    },
    enabled,
    initialData: options?.initialData,
  });
}

export type UseMatchDetailQueryOptions = {
  enabled?: boolean;
  initialData?: MatchSummary;
};

export function useMatchDetailQuery(matchId?: string, options?: UseMatchDetailQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchId);
  const queryKey = useMemo(() => matchDetailQueryKeys.detail(matchId ?? ""), [matchId]);

  return useQuery<MatchSummary>({
    queryKey,
    queryFn: async () => {
      if (!matchId) {
        throw new Error("matchId is required to fetch match detail");
      }
      return getJson<MatchSummary>(`/api/matches/${matchId}`, { auth: true });
    },
    enabled,
    initialData: options?.initialData,
  });
}
