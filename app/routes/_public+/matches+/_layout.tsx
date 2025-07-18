import { Outlet } from "@remix-run/react";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";

const Breadcrumb = () => {
  return (
    <>
      <BreadcrumbLink to="/matches">매치</BreadcrumbLink>
    </>
  );
};

export const handle = {
  breadcrumb: () => <Breadcrumb />,
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
