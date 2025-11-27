/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { Outlet, type ShouldRevalidateFunction, useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { LoadingSwitch } from "~/components/LoadingSwitch";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { Skeleton } from "~/components/ui/skeleton";
import {
  CLUB_BOARD_FEED_TAKE,
  CLUB_MATCH_FEED_TAKE,
  type ClubMatchFeed,
  clubBoardQueryKeys,
  clubInfoQueryKeys,
  clubMatchQueryKeys,
  clubMemberQueryKeys,
  prefetchClubBoardFeed,
  useClubDetailsQuery,
  useMembershipInfoQuery,
} from "~/features/clubs/isomorphic";
import { getJson } from "~/libs/api-client";
import { scheduleIdle } from "~/libs/scheduleIdle";

const ClubBreadcrumb = ({ clubId }: { clubId?: string }) => {
  const { data } = useClubDetailsQuery(clubId ?? "", { enabled: Boolean(clubId) });
  const label = data?.name ?? "클럽";
  return <BreadcrumbLink to={`/clubs/${clubId}`}>{label}</BreadcrumbLink>;
};

export const handle = {
  breadcrumb: (match: any) => <ClubBreadcrumb clubId={match.params.clubId} />,
};

interface ILayoutProps {}

const ClubLayoutSkeleton = () => (
  <div className="flex flex-col gap-4 w-full">
    <div className="flex gap-2 items-center">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

const Layout = (_props: ILayoutProps) => {
  const params = useParams();
  const clubId = params.clubId!;
  const queryClient = useQueryClient();
  const { data: clubData, isLoading: isClubLoading } = useClubDetailsQuery(clubId, {
    enabled: Boolean(clubId),
  });
  const { data: playerData, isLoading: isMembershipLoading } = useMembershipInfoQuery(clubId, {
    enabled: Boolean(clubId),
  });
  const club = clubData ?? null;
  const player = playerData ?? null;

  useEffect(() => {
    if (!club) return;
    const selectedClubId = club.id;
    queryClient.setQueryData(clubInfoQueryKeys.club(selectedClubId), club);
    queryClient.setQueryData(clubInfoQueryKeys.membership(selectedClubId), player ?? null);

    const controller = new AbortController();
    const prefetch = async () => {
      const tasks: Array<Promise<unknown>> = [];

      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: clubBoardQueryKeys.tabs(selectedClubId),
            queryFn: () =>
              getJson(`/api/clubs/${selectedClubId}/boards/tabs`, {
                signal: controller.signal,
              }),
          })
          .catch(() => undefined),
      );

      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: clubMemberQueryKeys.approved(selectedClubId),
            queryFn: () =>
              getJson(`/api/clubs/${selectedClubId}/members/approved`, {
                signal: controller.signal,
              }),
          })
          .catch(() => undefined),
      );

      tasks.push(
        queryClient
          .prefetchQuery({
            queryKey: clubMemberQueryKeys.pendings(selectedClubId),
            queryFn: () =>
              getJson(`/api/clubs/${selectedClubId}/members/pendings`, {
                signal: controller.signal,
              }),
          })
          .catch(() => undefined),
      );

      tasks.push(
        queryClient
          .prefetchInfiniteQuery<ClubMatchFeed>({
            queryKey: clubMatchQueryKeys.feed(selectedClubId),
            initialPageParam: null,
            queryFn: async ({ pageParam }) => {
              const searchParams = new URLSearchParams({ take: String(CLUB_MATCH_FEED_TAKE) });
              const cursor = typeof pageParam === "string" ? pageParam : null;
              if (cursor) searchParams.set("cursor", cursor);
              return getJson<ClubMatchFeed>(
                `/api/clubs/${selectedClubId}/matches?${searchParams.toString()}`,
                {
                  signal: controller.signal,
                },
              );
            },
            getNextPageParam: (lastPage: ClubMatchFeed) =>
              lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
          })
          .catch(() => undefined),
      );

      tasks.push(
        prefetchClubBoardFeed(queryClient, {
          clubId: selectedClubId,
          take: CLUB_BOARD_FEED_TAKE,
        }).catch(() => undefined),
      );

      await Promise.all(tasks);
    };

    document.title = `ONSOA | ${club.name}`;
    const cancel = scheduleIdle(() => {
      void prefetch();
    });
    return () => {
      cancel();
      controller.abort();
    };
  }, [club, player, queryClient]);

  if (isClubLoading || isMembershipLoading || !club) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  const status = player?.status;
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";

  const isLoading = isClubLoading || isMembershipLoading;
  if (!club && !isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <LoadingSwitch isLoading={isLoading} skeleton={<ClubLayoutSkeleton />}>
      <div className="flex flex-col gap-4 w-full @container">
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

        {!isPending && !isRejected && club && <Outlet />}
      </div>
    </LoadingSwitch>
  );
};

export default Layout;
