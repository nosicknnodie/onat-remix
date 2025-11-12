import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useClubMatchInitialData } from "~/features/clubs/isomorphic";
import type { MatchClubQueryResponse } from "./matchClub.types";

export const matchClubQueryKeys = {
  detail: (matchClubId: string) => ["match", "club", matchClubId, "detail"] as const,
} as const;

export type UseMatchClubQueryOptions = {
  enabled?: boolean;
  initialData?: MatchClubQueryResponse;
  clubId?: string;
};

export function useMatchClubQuery(matchClubId?: string, options?: UseMatchClubQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => matchClubQueryKeys.detail(matchClubId ?? ""), [matchClubId]);
  const initialDataFromFeed = useClubMatchInitialData(options?.clubId, matchClubId);
  const initialData = options?.initialData ?? initialDataFromFeed;

  return useQuery<MatchClubQueryResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch match club detail");
      }
      const res = await fetch(`/api/matchClubs/${matchClubId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch match club detail");
      }
      return (await res.json()) as MatchClubQueryResponse;
    },
    enabled,
    initialData,
  });
}
