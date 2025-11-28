import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type { MatchClubQueryResponse } from "~/features/matches/isomorphic";
import { getJson } from "~/libs/client/api-client";
import type { ClubMatchFeed } from "./match.types";

export const CLUB_MATCH_FEED_TAKE = 20;

export const clubMatchQueryKeys = {
  feed: (clubId: string) => ["club", clubId, "matches", "feed"] as const,
} as const;

export type ClubMatchFeedQueryKey = ReturnType<typeof clubMatchQueryKeys.feed>;

type ClubMatchInfiniteOptions = UseInfiniteQueryOptions<
  ClubMatchFeed,
  unknown,
  InfiniteData<ClubMatchFeed>,
  ClubMatchFeed,
  ClubMatchFeedQueryKey,
  string | null
>;

type UseClubMatchFeedOptions = Omit<
  ClubMatchInfiniteOptions,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
>;

export function useClubMatchFeedInfiniteQuery(
  clubId: string,
  take = CLUB_MATCH_FEED_TAKE,
  options?: UseClubMatchFeedOptions,
) {
  const queryKey = useMemo(() => clubMatchQueryKeys.feed(clubId), [clubId]);
  return useInfiniteQuery<
    ClubMatchFeed,
    unknown,
    InfiniteData<ClubMatchFeed>,
    ClubMatchFeedQueryKey,
    string | null
  >({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ take: String(take) });
      const cursor = typeof pageParam === "string" ? pageParam : null;
      if (cursor) {
        searchParams.set("cursor", cursor);
      }
      return getJson<ClubMatchFeed>(`/api/clubs/${clubId}/matches?${searchParams.toString()}`);
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useClubMatchInitialData(clubId?: string, matchClubId?: string) {
  const queryClient = useQueryClient();
  return useMemo<MatchClubQueryResponse | undefined>(() => {
    if (!clubId || !matchClubId) return undefined;
    const cache = queryClient.getQueryData<InfiniteData<ClubMatchFeed>>(
      clubMatchQueryKeys.feed(clubId),
    );
    if (!cache) return undefined;
    for (const page of cache.pages) {
      const matchClub = page.matches.find(
        (match: ClubMatchFeed["matches"][number]) => match.id === matchClubId,
      );
      if (matchClub) {
        return {
          matchClub: matchClub as unknown as MatchClubQueryResponse["matchClub"],
        } satisfies MatchClubQueryResponse;
      }
    }
    return undefined;
  }, [clubId, matchClubId, queryClient]);
}
