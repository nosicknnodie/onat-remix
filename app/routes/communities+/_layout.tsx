import { Outlet, UIMatch, useMatches } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import ItemLink from "~/components/ItemLink";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import Main from "~/template/layout/Main";
import MainInner from "~/template/layout/MainInner";
import MainSideMenu from "~/template/layout/MainSideMenu";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const boards = await prisma.board.findMany({
//     where: { isUse: true },
//     orderBy: { order: "asc" },
//   });

//   return { boards };
// };

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  // const loaderData = useLoaderData<typeof loader>();
  // const boards = loaderData.boards;
  const matches = useMatches() as UIMatch<
    unknown,
    { breadcrumb?: ((match: any) => React.ReactNode) | React.ReactNode }
  >[];
  return (
    <>
      <Main>
        <MainSideMenu />
        <MainInner>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to="/communities">커뮤니티</BreadcrumbLink>
              </BreadcrumbItem>
              {matches.map((match) => {
                if (match.handle?.breadcrumb) {
                  return (
                    <Fragment key={match.pathname}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink to={match.pathname}>
                          {typeof match.handle.breadcrumb === "function"
                            ? match.handle.breadcrumb(match)
                            : match.handle.breadcrumb}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Fragment>
                  );
                }
                return null;
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex justify-between">
            <div className="flex gap-x-4 p-2">
              {/* <ItemLink to={`/communities`} end>
              전체
            </ItemLink>
            {boards?.map((board) => {
              return (
                <ItemLink key={board.id} to={`/communities/${board.slug}`}>
                  {board.name}
                </ItemLink>
              );
            })} */}
            </div>
            <div>
              <ItemLink to={`/communities/new`}>
                <Button variant={"outline"} size={"sm"}>
                  새글 쓰기
                </Button>
              </ItemLink>
            </div>
          </div>
          <Outlet />
        </MainInner>
      </Main>
    </>
  );
};

export default Layout;
