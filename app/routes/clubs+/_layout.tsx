import { Outlet } from "@remix-run/react";
import { cn } from "~/libs/utils";
interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex flex-col "
        )}
      >
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
