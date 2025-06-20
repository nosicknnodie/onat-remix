import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const boards = await prisma.board.findMany({
    where: { isUse: true },
    orderBy: { order: "asc" },
  });

  return { boards };
};

export interface ILayoutContext {
  boards: Awaited<ReturnType<typeof loader>>["boards"];
}

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const boards = loaderData.boards;
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex flex-col "
        )}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/communities">커뮤니티</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between">
          <div className="flex gap-x-4 p-2">
            <ItemLink to={`/communities`} end>
              전체
            </ItemLink>
            {boards?.map((board) => {
              return (
                <ItemLink key={board.id} to={`/communities/${board.slug}`}>
                  {board.name}
                </ItemLink>
              );
            })}
          </div>
          <div>
            <Link to={`/communities/new`}>
              <Button variant={"outline"} size={"sm"}>
                새글 쓰기
              </Button>
            </Link>
          </div>
        </div>
        <Outlet context={{ boards }} />
      </main>
    </>
  );
};

export default Layout;
