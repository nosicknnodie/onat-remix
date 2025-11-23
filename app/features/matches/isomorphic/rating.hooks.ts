import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson } from "~/libs/api-client";
import type { RatingPageResponse, RatingStatsResponse } from "./rating.types";

export const ratingQueryKeys = {
  detail: (matchClubId: string) => ["MATCH_RATING_QUERY", matchClubId] as const,
  stats: (matchClubId: string) => ["MATCH_RATING_STATS_QUERY", matchClubId] as const,
} as const;

export type UseRatingQueryOptions = {
  enabled?: boolean;
  initialData?: RatingPageResponse;
};

export function useRatingQuery(matchClubId?: string, options?: UseRatingQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => ratingQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<RatingPageResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch rating data");
      }
      return getJson<RatingPageResponse>(`/api/matchClubs/${matchClubId}/rating`);
    },
    enabled,
    initialData: options?.initialData,
  });
}

type UseRatingStatsQueryOptions = {
  enabled?: boolean;
};

export function useRatingStatsQuery(matchClubId?: string, options?: UseRatingStatsQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => ratingQueryKeys.stats(matchClubId ?? ""), [matchClubId]);

  return useQuery<RatingStatsResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch rating stats");
      }
      return getJson<RatingStatsResponse>(`/api/matchClubs/${matchClubId}/rating/stats`);
    },
    enabled,
  });
}

type RatingMutationContext = {
  previous?: RatingPageResponse;
};

export type RatingScoreMutationVariables = {
  attendanceId: string;
  score: number;
};

export function useRatingScoreMutation(matchClubId?: string, userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ratingQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useMutation<void, unknown, RatingScoreMutationVariables, RatingMutationContext>({
    mutationFn: async ({ attendanceId, score }) => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to update evaluation score");
      }
      await postJson("/api/evaluations/score", {
        matchClubId,
        attendanceId,
        score,
      });
    },
    onMutate: async ({ attendanceId, score }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RatingPageResponse>(queryKey);
      if (previous && userId) {
        const next: RatingPageResponse = {
          ...previous,
          attendances: previous.attendances.map((att) =>
            att.id === attendanceId
              ? {
                  ...att,
                  evaluations: att.evaluations.map((ev) =>
                    ev.userId === userId ? { ...ev, score } : ev,
                  ),
                }
              : att,
          ),
        };
        queryClient.setQueryData(queryKey, next);
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export type RatingLikeMutationVariables = {
  attendanceId: string;
  liked: boolean;
};

export function useRatingLikeMutation(matchClubId?: string, userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ratingQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useMutation<void, unknown, RatingLikeMutationVariables, RatingMutationContext>({
    mutationFn: async ({ attendanceId, liked }) => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to toggle evaluation like");
      }
      await postJson("/api/evaluations/like", {
        matchClubId,
        attendanceId,
        liked,
      });
    },
    onMutate: async ({ attendanceId, liked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RatingPageResponse>(queryKey);
      if (previous && userId) {
        const next: RatingPageResponse = {
          ...previous,
          attendances: previous.attendances.map((att) =>
            att.id === attendanceId
              ? {
                  ...att,
                  evaluations: att.evaluations.map((ev) =>
                    ev.userId === userId ? { ...ev, liked } : ev,
                  ),
                }
              : att,
          ),
        };
        queryClient.setQueryData(queryKey, next);
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
