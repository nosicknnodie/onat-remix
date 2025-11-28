import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson } from "~/libs/client/api-client";
import type {
  RatingPageResponse,
  RatingRegisterResponse,
  RatingStatsResponse,
} from "./rating.types";

export const ratingQueryKeys = {
  detail: (matchClubId: string) => ["MATCH_RATING_QUERY", matchClubId] as const,
  stats: (matchClubId: string) => ["MATCH_RATING_STATS_QUERY", matchClubId] as const,
  register: (matchClubId: string) => ["MATCH_RATING_REGISTER_QUERY", matchClubId] as const,
  seed: (matchClubId: string) => ["MATCH_RATING_SEED", matchClubId] as const,
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

type UseRatingRegisterQueryOptions = {
  enabled?: boolean;
};

export function useRatingRegisterQuery(
  matchClubId?: string,
  options?: UseRatingRegisterQueryOptions,
) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => ratingQueryKeys.register(matchClubId ?? ""), [matchClubId]);

  return useQuery<RatingRegisterResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch rating register data");
      }
      return getJson<RatingRegisterResponse>(`/api/matchClubs/${matchClubId}/rating/register`);
    },
    enabled,
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
  previous?: RatingPageResponse | RatingRegisterResponse;
};

export type RatingScoreMutationVariables = {
  attendanceId: string;
  score: number;
};

type RatingMutationTarget = "detail" | "register";

type RatingMutationOptions = {
  userId?: string;
  target?: RatingMutationTarget;
};

export function useRatingSeedMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const registerKey = useMemo(() => ratingQueryKeys.register(matchClubId ?? ""), [matchClubId]);
  const statsKey = useMemo(() => ratingQueryKeys.stats(matchClubId ?? ""), [matchClubId]);
  return useMutation({
    mutationFn: async () => {
      if (!matchClubId) throw new Error("matchClubId is required");
      await postJson(`/api/matchClubs/${matchClubId}/ratings/seed`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: registerKey });
      queryClient.invalidateQueries({ queryKey: statsKey });
    },
  });
}

export function useRatingScoreMutation(matchClubId?: string, options?: RatingMutationOptions) {
  const queryClient = useQueryClient();
  const target: RatingMutationTarget = options?.target ?? "detail";
  const userId = options?.userId;
  const queryKey = useMemo(() => ratingQueryKeys[target](matchClubId ?? ""), [matchClubId, target]);

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
      const previous = queryClient.getQueryData<
        RatingPageResponse | RatingRegisterResponse | undefined
      >(queryKey);
      if (previous && userId) {
        if (target === "register") {
          const next: RatingRegisterResponse = {
            ...(previous as RatingRegisterResponse),
            attendances: (previous as RatingRegisterResponse).attendances.map((att) =>
              att.id === attendanceId
                ? {
                    ...att,
                    myEvaluation: {
                      id: att.myEvaluation?.id ?? `${attendanceId}-${userId ?? "me"}-local`,
                      liked: att.myEvaluation?.liked ?? false,
                      score,
                    },
                  }
                : att,
            ),
          };
          queryClient.setQueryData(queryKey, next);
        } else {
          const next: RatingPageResponse = {
            ...(previous as RatingPageResponse),
            attendances: (previous as RatingPageResponse).attendances.map((att) =>
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
      if (matchClubId) {
        queryClient.invalidateQueries({ queryKey: ratingQueryKeys.stats(matchClubId) });
      }
    },
  });
}

export type RatingLikeMutationVariables = {
  attendanceId: string;
  liked: boolean;
};

export function useRatingLikeMutation(matchClubId?: string, options?: RatingMutationOptions) {
  const queryClient = useQueryClient();
  const target: RatingMutationTarget = options?.target ?? "detail";
  const userId = options?.userId;
  const queryKey = useMemo(() => ratingQueryKeys[target](matchClubId ?? ""), [matchClubId, target]);

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
      const previous = queryClient.getQueryData<
        RatingPageResponse | RatingRegisterResponse | undefined
      >(queryKey);
      if (previous && userId) {
        if (target === "register") {
          const next: RatingRegisterResponse = {
            ...(previous as RatingRegisterResponse),
            attendances: (previous as RatingRegisterResponse).attendances.map((att) =>
              att.id === attendanceId
                ? {
                    ...att,
                    myEvaluation: {
                      id: att.myEvaluation?.id ?? `${attendanceId}-${userId ?? "me"}-local`,
                      score: att.myEvaluation?.score ?? 0,
                      liked,
                    },
                  }
                : att,
            ),
          };
          queryClient.setQueryData(queryKey, next);
        } else {
          const next: RatingPageResponse = {
            ...(previous as RatingPageResponse),
            attendances: (previous as RatingPageResponse).attendances.map((att) =>
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
      if (matchClubId) {
        queryClient.invalidateQueries({ queryKey: ratingQueryKeys.stats(matchClubId) });
      }
    },
  });
}
