import { useParams } from "@remix-run/react";
import { useCallback, useMemo } from "react";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { Loading } from "~/components/Loading";
import { ClubBoardPostCard } from "~/features/clubs/client";
import {
  type ClubBoardFeedResponse,
  useClubBoardFeedInfiniteQuery,
  useClubBoardsTabsQuery,
} from "~/features/clubs/isomorphic";

const SlugPage = () => {
  const { clubId, slug } = useParams();

  if (!clubId || !slug) {
    throw new Error("clubId or slug is missing from route params");
  }

  const { data: tabs } = useClubBoardsTabsQuery(clubId);
  const board = useMemo(() => tabs?.find((item) => item.slug === slug), [tabs, slug]);

  const { data, error, isLoading, isFetchingNextPage, fetchNextPage, refetch } =
    useClubBoardFeedInfiniteQuery({ clubId, slug });

  const posts = useMemo<ClubBoardFeedResponse["posts"]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.posts);
  }, [data]);

  const lastPageInfo = useMemo<ClubBoardFeedResponse["pageInfo"] | undefined>(() => {
    return data?.pages.at(-1)?.pageInfo;
  }, [data]);

  const hasMore = lastPageInfo?.hasMore ?? false;
  const handleLoadMore = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  const boardType = board?.type === "NOTICE" ? "compact" : "card";
  const fallbackBoard = board ?? {
    id: slug,
    slug,
    clubId,
    name: boardType === "compact" ? "공지" : "게시판",
  };

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
    <div className="flex flex-col gap-4" data-board-type={boardType}>
      {posts.map((post) => (
        <ClubBoardPostCard key={post.id} post={post} fallbackBoard={fallbackBoard} />
      ))}
      <InfiniteSentinel
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        disabled={isFetchingNextPage}
      />
    </div>
  );
};

export default SlugPage;
