import { Outlet } from "@remix-run/react";
import ItemLink from "~/components/ItemLink";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";

export const handle = {
  breadcrumb: () => (
    <>
      <BreadcrumbLink to="/communities">커뮤니티</BreadcrumbLink>
    </>
  ),
};

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <div className="flex justify-between">
        <div className="flex gap-x-4 p-2"></div>
        <div>
          <ItemLink to={`/communities/new`}>
            <Button variant={"outline"} size={"sm"}>
              새글 쓰기
            </Button>
          </ItemLink>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default Layout;
