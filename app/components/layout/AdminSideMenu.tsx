import { NavLink } from "@remix-run/react";
import { useMemo } from "react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

const AdminSideMenu = () => {
  const { open, toggleSidebar, setOpenMobile } = useSidebar();
  const adminMenus = useMemo(
    () => [{ title: "커뮤니티 관리", url: "/admin/communities", icon: HiOutlineSquares2X2 }],
    [],
  );
  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="mt-16">
        <SidebarMenu>
          <SidebarMenuItem className="p-2 flex justify-end">
            <Button
              onClick={toggleSidebar}
              size={"icon"}
              variant={"ghost"}
              className="hover:bg-transparent transition-transform"
            >
              {open ? <FaArrowAltCircleLeft /> : <FaArrowAltCircleRight />}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel>admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenus.map((menu) => (
                <SidebarMenuItem key={menu.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={menu.url} onClick={() => setOpenMobile(false)}>
                      <menu.icon />
                      {menu.title}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSideMenu;
