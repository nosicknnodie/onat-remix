import {
  type InfiniteData,
  type QueryClient,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SerializedEditorState } from "lexical";
import { useMemo } from "react";
import { getJson, postJson } from "~/libs/api-client";
import type { ClubBoardFeedQueryKey, ClubBoardFeedResponse } from "./board.types";
import type {
  ClubBoardCommentsResponse,
  ClubBoardCommentTreeNode,
  ClubBoardPostDetail,
  ClubBoardTabs,
} from "./types";

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

export type FeedQueryArgs = {
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
  postDetail: (postId: string) => ["club", "board", "post", postId] as const,
  postCommentsRoot: (postId: string) => ["COMMENTS_QUERY", postId] as const,
  postComments: (postId: string, path?: string | null) =>
    ["COMMENTS_QUERY", postId, path ?? null] as const,
} as const;

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useClubBoardQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url),
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
      return getJson<ClubBoardFeedResponse>(url);
    },
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function prefetchClubBoardFeed(queryClient: QueryClient, args: FeedQueryArgs) {
  const { clubId, slug, scope, take = CLUB_BOARD_FEED_TAKE } = args;
  const resolvedScope = scope ?? slug ?? "all";
  const queryKey = clubBoardQueryKeys.feed(clubId, resolvedScope);

  return queryClient.prefetchInfiniteQuery<
    ClubBoardFeedResponse,
    unknown,
    InfiniteData<ClubBoardFeedResponse>,
    ClubBoardFeedQueryKey
  >({
    queryKey,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ take: String(take) });
      const cursor = typeof pageParam === "string" ? pageParam : null;
      if (cursor) {
        searchParams.set("cursor", cursor);
      }
      const basePath = slug ? `/api/clubs/${clubId}/boards/${slug}` : `/api/clubs/${clubId}/boards`;
      const url = `${basePath}?${searchParams.toString()}`;
      return getJson<ClubBoardFeedResponse>(url);
    },
    getNextPageParam: (lastPage: ClubBoardFeedResponse) =>
      lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
  });
}

type CommentsQueryArgs = {
  postId?: string;
  path?: string;
};

export function useClubPostDetailQuery(postId?: string, options?: Options<ClubBoardPostDetail>) {
  const queryClient = useQueryClient();
  const { initialData: initialDataOption, enabled, ...restOptions } = options ?? {};

  const derivedInitialData = useMemo<ClubBoardPostDetail | undefined>(() => {
    if (!postId) {
      return undefined;
    }

    const feedQueries = queryClient.getQueriesData<InfiniteData<ClubBoardFeedResponse>>({
      queryKey: ["club"],
    });

    for (const [queryKey, data] of feedQueries) {
      if (!Array.isArray(queryKey)) continue;
      if (queryKey.length < 4) continue;
      if (queryKey[2] !== "board" || queryKey[3] !== "feed") continue;
      if (!data) continue;
      for (const page of data.pages) {
        const match = page.posts.find((post) => post.id === postId);
        if (match) {
          return { post: match } as ClubBoardPostDetail;
        }
      }
    }

    return undefined;
  }, [postId, queryClient]);

  const initialData = initialDataOption ?? derivedInitialData;

  return useQuery<ClubBoardPostDetail>({
    queryKey: clubBoardQueryKeys.postDetail(postId ?? ""),
    queryFn: async () => {
      if (!postId) {
        throw new Error("postId is required to fetch post detail");
      }
      return getJson<ClubBoardPostDetail>(`/api/posts/${postId}`);
    },
    enabled: enabled ?? Boolean(postId),
    refetchOnWindowFocus: false,
    initialData,
    ...restOptions,
  });
}

export function useClubPostCommentsQuery({ postId, path }: CommentsQueryArgs) {
  return useQuery<ClubBoardCommentsResponse>({
    queryKey: clubBoardQueryKeys.postComments(postId ?? "", path ?? null),
    queryFn: async () => {
      if (!postId) {
        throw new Error("postId is required to fetch comments");
      }
      const searchParams = new URLSearchParams();
      if (path) {
        searchParams.set("path", path);
      }
      const query = searchParams.toString();
      const url = `/api/posts/${postId}/comments${query ? `?${query}` : ""}`;
      return getJson<ClubBoardCommentsResponse>(url);
    },
    enabled: Boolean(postId),
    refetchOnWindowFocus: false,
  });
}

type CreateCommentVariables = {
  postId: string;
  content: SerializedEditorState;
  parentId?: string;
};

type CreateCommentResponse = {
  success: boolean;
  comment?: ClubBoardCommentTreeNode;
  errors?: string;
};

export function useCreateClubPostCommentMutation(
  options?: UseMutationOptions<CreateCommentResponse, unknown, CreateCommentVariables>,
) {
  return useMutation<CreateCommentResponse, unknown, CreateCommentVariables>({
    mutationFn: ({ postId, content, parentId }) =>
      postJson<CreateCommentResponse>(`/api/posts/${postId}/comments`, {
        content,
        parentId,
        postId,
      }),
    ...options,
  });
}
