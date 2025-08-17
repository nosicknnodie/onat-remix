import { Outlet } from "@remix-run/react";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";

interface ILayoutProps {}

export const handle = {
  breadcrumb: () => {
    return (
      <>
        <BreadcrumbLink to="/clubs">클럽</BreadcrumbLink>
      </>
    );
  },
};
const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default Layout;
