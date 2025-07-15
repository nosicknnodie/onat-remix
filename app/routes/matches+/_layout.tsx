import { Outlet } from "@remix-run/react";
import Main from "~/template/layout/Main";
import MainInner from "~/template/layout/MainInner";
import MainSideMenu from "~/template/layout/MainSideMenu";
interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <Main>
        <MainSideMenu />
        <MainInner>
          <Outlet />
        </MainInner>
      </Main>
    </>
  );
};

export default Layout;
