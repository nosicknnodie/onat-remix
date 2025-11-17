/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import { Outlet, type UIMatch, useMatches } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Fragment } from "react/jsx-runtime";
import { Loading } from "~/components/Loading";
import MainSideMenu from "~/components/layout/MainSideMenu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import type { ClubWithMembership } from "~/features/clubs/isomorphic";
import { clubInfoQueryKeys, clubMemberQueryKeys } from "~/features/clubs/isomorphic";
import { getJson } from "~/libs/api-client";

interface IPublicLayoutProps {}

const PublicLayout = (_props: IPublicLayoutProps) => {
  const queryClient = useQueryClient();
  const matches = useMatches() as UIMatch<
    unknown,
    {
      breadcrumb?: ((match: any) => React.ReactNode) | React.ReactNode;
      right?: (match: any) => React.ReactNode;
    }
  >[];
  const breadcrumbs = matches.filter((match) => match.handle?.breadcrumb);

  const rights = matches
    .filter((match) => Boolean(match.handle?.right))
    .map((match) => {
      const RightComp = match.handle?.right;
      if (!RightComp) return null;

      // handle.right는 React 컴포넌트 또는 ReactNode를 지원
      if (typeof RightComp === "function") {
        // 컴포넌트를 직접 호출하지 않고 JSX로 렌더링해 훅 규칙을 보존
        const Component = RightComp as React.ComponentType<{ match: typeof match }>;
        return <Component key={match.id} match={match} />;
      }
      return RightComp;
    });

  useEffect(() => {
    const controller = new AbortController();

    const hydrateClubCaches = (clubs?: ClubWithMembership[]) => {
      if (!clubs?.length) return;
      clubs.forEach((clubItem) => {
        const { membership, ...clubData } = clubItem;
        queryClient.setQueryData(clubInfoQueryKeys.club(clubData.id), clubData);
        queryClient.setQueryData(clubInfoQueryKeys.membership(clubData.id), membership ?? null);
      });
    };

    const prefetchMemberPermissions = async (clubs?: ClubWithMembership[]) => {
      if (!clubs?.length) return;
      const membershipIds = clubs
        .map((club) => club.membership?.id)
        .filter((id): id is string => Boolean(id));

      await Promise.all(
        membershipIds.map((playerId) =>
          queryClient.fetchQuery({
            queryKey: clubMemberQueryKeys.playerPermissions(playerId),
            queryFn: () =>
              getJson<string[]>(`/api/players/${playerId}/permissions`, {
                signal: controller.signal,
              }),
            staleTime: 1000 * 60 * 5,
          }),
        ),
      );
    };

    const prefetchMyClubs = async () => {
      const cached = queryClient.getQueryData<ClubWithMembership[]>(clubInfoQueryKeys.myClubs());
      if (cached) {
        hydrateClubCaches(cached);
        void prefetchMemberPermissions(cached);
        return;
      }

      try {
        const clubs = await queryClient.fetchQuery({
          queryKey: clubInfoQueryKeys.myClubs(),
          queryFn: () =>
            getJson<ClubWithMembership[]>("/api/clubs/my", {
              signal: controller.signal,
            }),
          staleTime: 1000 * 60 * 5,
        });
        hydrateClubCaches(clubs);
        void prefetchMemberPermissions(clubs);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[PublicLayout] Failed to prefetch my clubs", error);
      }
    };

    void prefetchMyClubs();

    return () => controller.abort();
  }, [queryClient]);

  return (
    <>
      <main className="mx-auto w-full md:max-xl:max-w-screen-lg xl:max-w-screen-2xl p-4 md:p-6 lg:p-8 flex justify-center">
        <MainSideMenu />
        <div className="flex-1 min-w-0 flex justify-start flex-col max-w-screen-lg w-full">
          <div className="flex justify-between">
            {breadcrumbs.length > 0 && (
              <>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink to="/">
                        <Avatar className="size-6 rounded-full">
                          <AvatarImage src="/apple-touch-icon.png" alt="logo" />
                          <AvatarFallback className="bg-primary-foreground">
                            <Loading />
                          </AvatarFallback>
                        </Avatar>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((match, i) => {
                      return (
                        <Fragment key={match.pathname}>
                          {i > 0 && <BreadcrumbSeparator />}
                          <BreadcrumbItem>
                            {typeof match.handle.breadcrumb === "function"
                              ? match.handle.breadcrumb(match)
                              : match.handle.breadcrumb}
                          </BreadcrumbItem>
                        </Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
            <div>
              {rights.map((right, i) => {
                return <Fragment key={`${i + 1}`}>{right}</Fragment>;
              })}
            </div>
          </div>
          <div className="mt-2">
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
};

export default PublicLayout;
