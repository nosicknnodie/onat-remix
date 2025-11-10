import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { InfiniteListProvider, useInfiniteList } from "~/contexts";
import { ClubBoardPostCard } from "~/features/clubs/client";
import { boardService } from "~/features/clubs/server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const slug = params.slug!;
  const clubId = params.clubId!;
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take")) || 20, 50);
  const cursor = url.searchParams.get("cursor");
  const result = await boardService.getBoardFeed({
    clubId,
    slug,
    take,
    cursor,
    userId: user?.id,
  });
  if (!result.board) {
    throw new Response("Board not found", { status: 404 });
  }
  return result;
};

interface ISlugPageProps {}

const SlugPage = (_props: ISlugPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const [type, setType] = useState<"compact" | "card">(
    board?.type === "NOTICE" ? "compact" : "card",
  );
  useEffect(() => {
    setType(board?.type === "NOTICE" ? "compact" : "card");
  }, [board?.type]);

  return (
    <InfiniteListProvider
      key={board?.id}
      slug={board?.slug || ""}
      type={type}
      keySelector={(post) => String(post.id)}
      initialItems={loaderData.posts || []}
      initialPageInfo={loaderData.pageInfo || { hasMore: false, nextCursor: null, take: 20 }}
    >
      {type === "compact" ? <CompactTypeComponent /> : <CardTypeComponent />}
    </InfiniteListProvider>
  );
};

type LoaderData = Awaited<ReturnType<typeof loader>>;
type Post = LoaderData["posts"][number];

const CompactTypeComponent = () => {
  const context = useInfiniteList<Post>();
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const items = context.state.items;
  const pageInfo = context.state.pageInfo;

  return (
    <div className="flex flex-col gap-4">
      {items?.map((post) => (
        <ClubBoardPostCard key={post.id} post={post} fallbackBoard={board ?? undefined} />
      ))}
      <InfiniteSentinel
        hasMore={pageInfo?.hasMore || false}
        onLoadMore={() => context.loadMore()}
      />
    </div>
  );
};

const CardTypeComponent = () => {
  const context = useInfiniteList<Post>();
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const items = context.state.items;
  const pageInfo = context.state.pageInfo;

  return (
    <div className="flex flex-col gap-4">
      {items?.map((post) => (
        <ClubBoardPostCard key={post.id} post={post} fallbackBoard={board ?? undefined} />
      ))}
      <InfiniteSentinel
        hasMore={pageInfo?.hasMore || false}
        onLoadMore={() => context.loadMore()}
      />
    </div>
  );
};

export default SlugPage;
