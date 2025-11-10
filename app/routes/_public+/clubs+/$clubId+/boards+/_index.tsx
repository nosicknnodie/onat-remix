import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { InfiniteListProvider, useInfiniteList } from "~/contexts";
import { ClubBoardPostCard } from "~/features/clubs/client";
import { useClubBoardsTabsQuery } from "~/features/clubs/isomorphic";
import { boardService } from "~/features/clubs/server";
import { getUser } from "~/libs/db/lucia.server";

export const handle = {
  breadcrumb: "게시판",
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const clubId = params.clubId;
  if (!clubId) {
    throw new Response("Club not found", { status: 404 });
  }

  const user = await getUser(request);
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take")) || 30, 50);
  const cursor = url.searchParams.get("cursor");

  const feed = await boardService.getClubFeed({
    clubId,
    take,
    cursor,
    userId: user?.id,
  });

  return feed;
};

type LoaderData = Awaited<ReturnType<typeof loader>>;
type Post = LoaderData["posts"][number];

const Boards = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { clubId } = useParams();
  return (
    <InfiniteListProvider<Post>
      slug={`all-${clubId ?? "unknown"}`}
      type="card"
      initialItems={loaderData.posts}
      initialPageInfo={loaderData.pageInfo}
      keySelector={(post) => post.id}
    >
      <AllBoardsFeed />
    </InfiniteListProvider>
  );
};

const AllBoardsFeed = () => {
  const context = useInfiniteList<Post>();
  const items = context.state.items;
  const pageInfo = context.state.pageInfo;

  return (
    <div className="flex flex-col gap-4">
      {items.map((post) => (
        <ClubBoardPostCard key={post.id} post={post} />
      ))}
      <InfiniteSentinel hasMore={pageInfo.hasMore} onLoadMore={context.loadMore} />
    </div>
  );
};

export default Boards;
