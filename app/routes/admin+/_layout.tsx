import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    // 로그인 안된 사용자는 로그인 페이지로 리디렉트
    throw redirect("/auth/login");
  }
  if (user.role !== "ADMIN") {
    // 관리자가 않은 사용자는 404 페이지로 리디렉트
    throw redirect("/");
  }
  return null;
};

interface IAdminLayoutProps {}

const AdminLayout = (_props: IAdminLayoutProps) => {
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex justify-center items-start "
        )}
      >
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;
