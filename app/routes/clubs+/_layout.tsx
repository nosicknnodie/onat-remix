import { Outlet } from "@remix-run/react";
import Main from "~/template/layout/Main";
import MainInner from "~/template/layout/MainInner";
import MainSideMenu from "~/template/layout/MainSideMenu";
interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <Main>
        {/* 왼쪽 사이드 메뉴 */}
        <MainSideMenu />

        {/* 중앙 콘텐츠 */}
        <MainInner>
          <Outlet />
        </MainInner>
      </Main>
    </>
  );
};

export default Layout;
