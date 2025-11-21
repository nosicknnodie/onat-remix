import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson } from "~/libs/api-client";
import type { RecordGoalRequest, RecordPageResponse } from "./record.types";

export const recordQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "record"] as const,
} as const;

export type UseRecordQueryOptions = {
  enabled?: boolean;
  initialData?: RecordPageResponse;
};

export function useRecordQuery(matchClubId?: string, options?: UseRecordQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => recordQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<RecordPageResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch match record");
      }
      return await getJson<RecordPageResponse>(`/api/matchClubs/${matchClubId}/record`);
    },
    enabled,
    initialData: options?.initialData,
  });
}

export function useRecordGoalMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => recordQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useMutation<void, unknown, RecordGoalRequest>({
    mutationFn: async (variables) => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to register goal");
      }
      await postJson("/api/record", variables);
    },
    onSuccess: () => {
      if (!matchClubId) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
