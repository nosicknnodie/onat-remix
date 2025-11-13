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
import { clubInfoQueryKeys } from "~/features/clubs/isomorphic";
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
    .filter((match) => match.handle?.right)
    .map((match) => {
      return match.handle.right?.(match);
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

    const prefetchMyClubs = async () => {
      const cached = queryClient.getQueryData<ClubWithMembership[]>(clubInfoQueryKeys.myClubs());
      if (cached) {
        hydrateClubCaches(cached);
        return;
      }

      try {
        const clubs = await queryClient.fetchQuery({
          queryKey: clubInfoQueryKeys.myClubs(),
          queryFn: () =>
            getJson<ClubWithMembership[]>("/api/clubs/my", {
              auth: true,
              signal: controller.signal,
            }),
          staleTime: 1000 * 60 * 5,
        });
        hydrateClubCaches(clubs);
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
