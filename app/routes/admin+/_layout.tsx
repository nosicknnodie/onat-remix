import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import AdminSideMenu from "~/components/layout/AdminSideMenu";
import { getUser } from "~/libs/index.server";

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
      <main className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8 flex justify-center">
        <AdminSideMenu />
        <div className="flex-1 min-w-0 flex justify-start flex-col max-w-screen-lg w-full">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default AdminLayout;
