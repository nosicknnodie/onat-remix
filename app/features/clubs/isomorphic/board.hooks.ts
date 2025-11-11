import {
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { ClubBoardFeedQueryKey, ClubBoardFeedResponse } from "./board.types";
import type { ClubBoardTabs } from "./types";

type ClubBoardInfiniteOptions = UseInfiniteQueryOptions<
  ClubBoardFeedResponse,
  unknown,
  InfiniteData<ClubBoardFeedResponse>,
  ClubBoardFeedResponse,
  ClubBoardFeedQueryKey,
  string | null
>;

type UseClubBoardFeedOptions = Omit<
  ClubBoardInfiniteOptions,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
>;

type FeedQueryArgs = {
  clubId: string;
  slug?: string;
  scope?: string;
  take?: number;
};

export const CLUB_BOARD_FEED_TAKE = 30;

export const clubBoardQueryKeys = {
  tabs: (clubId: string) => ["club", clubId, "board", "tabs"] as const,
  feed: (clubId: string, scope: string): ClubBoardFeedQueryKey => [
    "club",
    clubId,
    "board",
    "feed",
    scope,
  ],
} as const;

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useClubBoardQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url, { auth: true }),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useClubBoardsTabsQuery(clubId: string, options?: Options<ClubBoardTabs>) {
  return useClubBoardQuery<ClubBoardTabs>(
    clubBoardQueryKeys.tabs(clubId),
    `/api/clubs/${clubId}/boards/tabs`,
    options,
  );
}

export function useClubBoardFeedInfiniteQuery(
  { clubId, slug, scope, take = CLUB_BOARD_FEED_TAKE }: FeedQueryArgs,
  options?: UseClubBoardFeedOptions,
) {
  const resolvedScope = scope ?? slug ?? "all";
  const queryKey = useMemo(
    () => clubBoardQueryKeys.feed(clubId, resolvedScope),
    [clubId, resolvedScope],
  );

  return useInfiniteQuery<
    ClubBoardFeedResponse,
    unknown,
    InfiniteData<ClubBoardFeedResponse>,
    ClubBoardFeedQueryKey,
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
      const basePath = slug ? `/api/clubs/${clubId}/boards/${slug}` : `/api/clubs/${clubId}/boards`;
      const url = `${basePath}?${searchParams.toString()}`;
      return getJson<ClubBoardFeedResponse>(url, { auth: true });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    refetchOnWindowFocus: false,
    ...options,
  });
}
