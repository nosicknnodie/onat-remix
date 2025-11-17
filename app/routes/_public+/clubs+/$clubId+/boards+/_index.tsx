import { useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/Link";
import { ClubBoardPostCard, ClubPermissionGate } from "~/features/clubs/client";
import {
  type ClubBoardFeedResponse,
  clubBoardQueryKeys,
  prefetchClubBoardFeed,
  useClubBoardFeedInfiniteQuery,
  useClubBoardsTabsQuery,
} from "~/features/clubs/isomorphic";

const RightComponent = () => {
  const { clubId } = useParams();
  return (
    <>
      <ClubPermissionGate clubId={clubId} permission="BOARD_MANAGER">
        <Button asChild variant="outline">
          <Link to={`/clubs/${clubId}/boards/new`}>게시글 추가</Link>
        </Button>
      </ClubPermissionGate>
    </>
  );
};

export const handle = { right: RightComponent };

const Boards = () => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }

  const queryClient = useQueryClient();
  const { data: tabs } = useClubBoardsTabsQuery(clubId);
  const { data, isLoading, error, fetchNextPage, isFetchingNextPage, refetch } =
    useClubBoardFeedInfiniteQuery({ clubId });

  useEffect(() => {
    if (!tabs || isLoading) {
      return;
    }
    tabs.forEach((board) => {
      if (!board.slug) {
        return;
      }
      const key = clubBoardQueryKeys.feed(clubId, board.slug);
      const state = queryClient.getQueryState(key);
      if (state?.data) {
        return;
      }
      void prefetchClubBoardFeed(queryClient, { clubId, slug: board.slug });
    });
  }, [clubId, isLoading, queryClient, tabs]);

  const posts = useMemo<ClubBoardFeedResponse["posts"]>(() => {
    if (!data) {
      return [];
    }
    return data.pages.flatMap((page) => page.posts);
  }, [data]);

  const lastPageInfo = useMemo<ClubBoardFeedResponse["pageInfo"] | undefined>(() => {
    if (!data || data.pages.length === 0) {
      return undefined;
    }
    const lastPage = data.pages[data.pages.length - 1];
    return lastPage?.pageInfo;
  }, [data]);

  const hasMore = lastPageInfo?.hasMore ?? false;
  const handleLoadMore = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  if (error) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <p>게시글을 불러오는 중 오류가 발생했습니다.</p>
        <button type="button" className="text-primary" onClick={() => void refetch()}>
          다시 시도하기
        </button>
      </div>
    );
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <ClubBoardPostCard key={post.id} post={post} />
      ))}
      <InfiniteSentinel
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        disabled={isFetchingNextPage}
        loadingText="불러오는 중..."
      />
    </div>
  );
};

export default Boards;
