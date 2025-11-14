import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { RecordPageResponse } from "./record.types";

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
      return await getJson<RecordPageResponse>(`/api/matchClubs/${matchClubId}/record`, {
        auth: true,
      });
    },
    enabled,
    initialData: options?.initialData,
  });
}
