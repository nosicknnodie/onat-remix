/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, type ShouldRevalidateFunction, useLoaderData } from "@remix-run/react";
import {
  type DehydratedState,
  dehydrate,
  HydrationBoundary,
  type InfiniteData,
  QueryClient,
} from "@tanstack/react-query";
import {
  CLUB_BOARD_FEED_TAKE,
  type ClubBoardFeedResponse,
  clubBoardQueryKeys,
} from "~/features/clubs/isomorphic";
import { boardService } from "~/features/clubs/server";
import { getUser } from "~/libs/db/lucia.server";

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  const clubId = params.clubId;
  if (!clubId || !slug) {
    throw new Response("Board not found", { status: 404 });
  }

  const user = await getUser(request);
  const queryClient = new QueryClient();
  const feed = await boardService.getBoardFeed({
    clubId,
    slug,
    take: CLUB_BOARD_FEED_TAKE,
    userId: user?.id,
  });

  if (!feed.board) {
    throw new Response("Board not found", { status: 404 });
  }

  const payload: ClubBoardFeedResponse = {
    posts: feed.posts,
    pageInfo: feed.pageInfo,
  };
  const initialFeed: InfiniteData<ClubBoardFeedResponse, string | null> = {
    pages: [payload],
    pageParams: [null],
  };
  queryClient.setQueryData(clubBoardQueryKeys.feed(clubId, slug), initialFeed);

  return { board: feed.board, dehydratedState: dehydrate(queryClient) } satisfies LoaderData;
};

export const handle = {
  breadcrumb: (match: { data: any; params: { clubId?: string; slug?: string } }) => {
    return (
      <Link to={`/clubs/${match.params.clubId}/boards/${match.params.slug}`}>
        {match.data?.board?.name || "게시판"}
      </Link>
    );
  },
};

type LoaderData = {
  board: NonNullable<Awaited<ReturnType<typeof boardService.getBoardBySlug>>>;
  dehydratedState: DehydratedState;
};

export default function Layout() {
  const data = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={data.dehydratedState}>
      <Outlet />
    </HydrationBoundary>
  );
}
