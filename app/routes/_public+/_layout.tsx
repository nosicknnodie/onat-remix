import { Outlet, UIMatch, useMatches } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
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
  return (
    <>
      <main className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8 flex justify-center">
        <MainSideMenu />
        <div className="flex-1 min-w-0 flex justify-start flex-col max-w-screen-lg w-full">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              {matches.map((match) => {
                if (match.handle?.breadcrumb) {
                  return (
                    <Fragment key={match.pathname}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {typeof match.handle.breadcrumb === "function"
                          ? match.handle.breadcrumb(match)
                          : match.handle.breadcrumb}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                }
                return null;
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
