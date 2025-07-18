import { Outlet } from "@remix-run/react";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";

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
      <Outlet />
    </>
  );
};

export default Layout;
