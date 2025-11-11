/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { Board, Club, File, Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, type ShouldRevalidateFunction, useLoaderData } from "@remix-run/react";
import {
  type DehydratedState,
  dehydrate,
  HydrationBoundary,
  type InfiniteData,
  QueryClient,
} from "@tanstack/react-query";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  CLUB_BOARD_FEED_TAKE,
  type ClubBoardFeedResponse,
  clubBoardQueryKeys,
  clubInfoQueryKeys,
  clubMemberQueryKeys,
} from "~/features/clubs/isomorphic";
import { boardService, service as clubService, infoService } from "~/features/clubs/server";
import { cn } from "~/libs";
import { getUser } from "~/libs/index.server";

export const handle = {
  breadcrumb: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        <BreadcrumbLink to={`/clubs/${params.clubId}`}>{data.club.name}</BreadcrumbLink>
      </>
    );
  },
  right: (match: any) => {
    const data = match.data;
    const params = match.params;
    return (
      <>
        {(data.player?.role === "MANAGER" || data.player?.role === "MASTER") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
                )}
              >
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/clubs/${params.clubId}/edit`}>클럽 수정</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/clubs/${params.clubId}/matches/new`}>매치 추가</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/clubs/${params.clubId}/boards/new`}>게시글 추가</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    );
  },
};

interface ILayoutProps {}

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const clubId = params.clubId;
  if (!clubId) {
    throw redirect("/404");
  }
  const user = await getUser(request);
  const { club, player } = await infoService.getClubLayoutData(clubId, user?.id);

  if (!club) {
    throw redirect("/404");
  }

  const queryClient = new QueryClient();
  const [infoData, boards, approvedMembers, pendingMembers, clubFeed] = await Promise.all([
    infoService.getClubInfoData(clubId),
    boardService.getBoardTabs(clubId),
    clubService.getClubMembers(clubId),
    clubService.getPendingClubMembers(clubId),
    boardService.getClubFeed({
      clubId,
      take: CLUB_BOARD_FEED_TAKE,
      userId: user?.id,
    }),
  ]);

  queryClient.setQueryData(clubInfoQueryKeys.recentMatch(clubId), infoData.recentMatch);
  queryClient.setQueryData(clubInfoQueryKeys.upcomingMatch(clubId), infoData.upcomingMatch);
  queryClient.setQueryData(clubInfoQueryKeys.attendance(clubId), infoData.attendance);
  queryClient.setQueryData(clubInfoQueryKeys.goalLeaders(clubId), infoData.goalLeaders);
  queryClient.setQueryData(clubInfoQueryKeys.ratingLeaders(clubId), infoData.ratingLeaders);
  queryClient.setQueryData(clubInfoQueryKeys.notices(clubId), infoData.notices);
  queryClient.setQueryData(clubInfoQueryKeys.club(clubId), club);
  queryClient.setQueryData(clubInfoQueryKeys.membership(clubId), player ?? null);

  queryClient.setQueryData(clubBoardQueryKeys.tabs(clubId), boards);
  queryClient.setQueryData(clubMemberQueryKeys.approved(clubId), approvedMembers);
  queryClient.setQueryData(clubMemberQueryKeys.pendings(clubId), pendingMembers);
  const initialFeed: InfiniteData<ClubBoardFeedResponse, string | null> = {
    pages: [clubFeed],
    pageParams: [null],
  };
  queryClient.setQueryData(clubBoardQueryKeys.feed(clubId, "all"), initialFeed);

  return { club, player, dehydratedState: dehydrate(queryClient) };
}

export type IClubLayoutLoaderData = {
  club: Club & {
    image?: File | null;
    emblem?: File | null;
    boards?: Board[];
  };
  player: (Player & { user: { userImage: string } }) | null;
  dehydratedState: DehydratedState;
};

const Layout = (_props: ILayoutProps) => {
  const data = useLoaderData<IClubLayoutLoaderData>();

  const status = data.player?.status;
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";

  return (
    <HydrationBoundary state={data.dehydratedState}>
      <div className="flex flex-col gap-4 w-full">
        {isPending && (
          <div className="space-y-2">
            <FormSuccess>가입 승인 대기중입니다.</FormSuccess>
            <p className="text-sm text-muted-foreground">
              클럽 관리자가 승인하면 클럽 정보를 확인하실 수 있습니다.
            </p>
          </div>
        )}

        {isRejected && (
          <FormError className="py-2">
            가입 신청이 거절되었습니다. 필요시 다시 신청해 주세요.
          </FormError>
        )}

        {!isPending && !isRejected && <Outlet />}
      </div>
    </HydrationBoundary>
  );
};

export default Layout;
