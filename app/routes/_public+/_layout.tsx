/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import { Outlet, type UIMatch, useLoaderData, useMatches } from "@remix-run/react";
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
import { clubInfoQueryKeys, clubMemberQueryKeys } from "~/features/clubs/isomorphic";
import { memberService, service } from "~/features/clubs/server";
import { getUser } from "~/libs/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return json({ myClubs: [], permissions: {} as Record<string, string[]> });
  }

  const myClubs = await service.getMyClubsData(user.id);
  const permissionsEntries = await Promise.all(
    myClubs.map(async (club) => {
      const membership = club.membership;
      if (!membership) return null;
      const permissions = await memberService.getEffectivePermissions({
        id: membership.id,
        role: membership.role,
      });
      return [membership.id, permissions] as const;
    }),
  );

  const permissions = Object.fromEntries(
    permissionsEntries.filter(Boolean) as Array<[string, string[]]>,
  );

  return json({ myClubs, permissions });
};

interface IPublicLayoutProps {}

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

const PublicLayout = (_props: IPublicLayoutProps) => {
  const { myClubs, permissions } = useLoaderData<typeof loader>();
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
    queryClient.setQueryData(clubInfoQueryKeys.myClubs(), myClubs);
    myClubs.forEach((clubItem) => {
      const { membership, ...clubData } = clubItem;
      queryClient.setQueryData(clubInfoQueryKeys.club(clubData.id), clubData);
      queryClient.setQueryData(clubInfoQueryKeys.membership(clubData.id), membership ?? null);
      if (membership?.id && permissions[membership.id]) {
        queryClient.setQueryData(
          clubMemberQueryKeys.playerPermissions(membership.id),
          permissions[membership.id],
        );
      }
    });
  }, [myClubs, permissions, queryClient]);

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
