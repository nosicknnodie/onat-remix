import { Outlet, UIMatch, useMatches } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import MainSideMenu from "~/template/layout/MainSideMenu";

interface IPublicLayoutProps {}

const PublicLayout = (_props: IPublicLayoutProps) => {
  const matches = useMatches() as UIMatch<
    unknown,
    { breadcrumb?: ((match: any) => React.ReactNode) | React.ReactNode }
  >[];
  const breadcrumbs = matches.filter((match) => match.handle?.breadcrumb);
  return (
    <>
      <main className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8 flex justify-center">
        <MainSideMenu />
        <div className="flex-1 min-w-0 flex justify-start flex-col max-w-screen-lg w-full">
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
          <div className="mt-2">
            <Outlet />
          </div>
        </div>
      </main>
    </>
  );
};

export default PublicLayout;
