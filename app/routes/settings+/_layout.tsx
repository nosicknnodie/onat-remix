import { NavLink, Outlet } from "@remix-run/react";

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <div className="flex flex-col w-full ">
        <nav className="mb-4 border-b">
          <ul className="flex gap-6 px-6 py-4 text-base">
            <li>
              <NavLink
                to="/settings/edit"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 pb-1"
                }
              >
                프로필
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings/body"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 pb-1"
                }
              >
                신체 정보
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings/position"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 pb-1"
                }
              >
                포지션
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings/security"
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-blue-600 border-b-2 border-blue-600 pb-1"
                    : "text-gray-600 pb-1"
                }
              >
                보안 설정
              </NavLink>
            </li>
          </ul>
        </nav>
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
