import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson, putJson } from "~/libs/api-client";
import type {
  MercenaryFormValues,
  MercenaryMutationResult,
  MercenaryQueryResponse,
} from "./mercenary.types";

export const mercenaryQueryKeys = {
  list: (clubId: string) => ["club", clubId, "mercenaries"] as const,
} as const;

type UseMercenariesQueryOptions = {
  enabled?: boolean;
  initialData?: MercenaryQueryResponse;
};

export function useMercenariesQuery(clubId?: string, options?: UseMercenariesQueryOptions) {
  const enabled = options?.enabled ?? Boolean(clubId);
  const queryKey = useMemo(() => mercenaryQueryKeys.list(clubId ?? ""), [clubId]);

  return useQuery<MercenaryQueryResponse>({
    queryKey,
    queryFn: async () => {
      if (!clubId) {
        throw new Error("clubId is required to fetch mercenaries");
      }
      return getJson<MercenaryQueryResponse>(`/api/clubs/${clubId}/mercenaries`);
    },
    enabled,
    initialData: options?.initialData,
  });
}

export function useCreateMercenaryMutation(clubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => (clubId ? mercenaryQueryKeys.list(clubId) : null), [clubId]);

  return useMutation<MercenaryMutationResult, unknown, MercenaryFormValues>({
    mutationFn: async (input) => {
      if (!clubId) {
        throw new Error("clubId is required to create mercenary");
      }
      return postJson<MercenaryMutationResult>(`/api/clubs/${clubId}/mercenaries/register`, input);
    },
    onSuccess: async () => {
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

type UpdateMercenaryInput = MercenaryFormValues & { mercenaryId: string };

export function useUpdateMercenaryMutation(clubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => (clubId ? mercenaryQueryKeys.list(clubId) : null), [clubId]);

  return useMutation<MercenaryMutationResult, unknown, UpdateMercenaryInput>({
    mutationFn: async ({ mercenaryId, ...input }) => {
      if (!clubId) {
        throw new Error("clubId is required to update mercenary");
      }
      return putJson<MercenaryMutationResult>(
        `/api/clubs/${clubId}/mercenaries/${mercenaryId}`,
        input,
      );
    },
    onSuccess: async () => {
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
