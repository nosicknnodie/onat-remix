import { NavLink, Outlet } from "@remix-run/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { cn } from "~/libs/utils";

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <main
        className={cn(
          "mx-auto w-full max-w-screen-lg p-1 md:p-2 2xl:p-3 flex flex-col"
        )}
      >
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>회원정보 수정</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col w-full ">
          <nav className="border-b w-full">
            <ul className="flex gap-6 px-6 py-4 text-base w-full">
              <li>
                <NavLink
                  to="/settings/edit"
                  className={({ isActive }) =>
                    cn(
                      "text-gray-600 pb-1 relative incline-block font-semibold",
                      "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                      {
                        "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                          isActive,
                      }
                    )
                  }
                >
                  프로필
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings/body"
                  className={({ isActive }) =>
                    cn(
                      "text-gray-600 pb-1 relative incline-block font-semibold",
                      "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                      {
                        "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                          isActive,
                      }
                    )
                  }
                >
                  신체 정보
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings/position"
                  className={({ isActive }) =>
                    cn(
                      "text-gray-600 pb-1 relative incline-block font-semibold",
                      "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                      {
                        "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                          isActive,
                      }
                    )
                  }
                >
                  포지션
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings/security"
                  className={({ isActive }) =>
                    cn(
                      "text-gray-600 pb-1 relative incline-block font-semibold",
                      "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                      {
                        "text-primary font-bold after:absolute after:-right-1.5 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
                          isActive,
                      }
                    )
                  }
                >
                  보안 설정
                </NavLink>
              </li>
            </ul>
          </nav>
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default Layout;
