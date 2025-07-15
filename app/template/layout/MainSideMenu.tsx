import { Board } from "@prisma/client";
import { NavLink } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useMemo } from "react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { FiFileText, FiImage, FiLink, FiVideo } from "react-icons/fi";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { MdCampaign, MdGroups2 } from "react-icons/md";
import { TbSoccerField } from "react-icons/tb";
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
  SidebarMenuSkeleton,
  useSidebar,
} from "~/components/ui/sidebar";
interface IMainSideMenuProps {}

const MainSideMenu = (_props: IMainSideMenuProps) => {
  const { open, toggleSidebar, setOpenMobile } = useSidebar();
  const { data, isLoading } = useQuery({
    queryKey: ["BOARDS_MENU_QUERY"],
    queryFn: async () => {
      return await fetch("/api/boards").then((res) => res.json());
    },
  });
  const boards = data?.boards;
  const applicationMenus = useMemo(
    () => [
      { title: "DashBoard", url: "/", icon: HiOutlineSquares2X2 },
      { title: "클럽", url: "/clubs", icon: MdGroups2 },
      { title: "매치", url: "/matches", icon: TbSoccerField },
    ],
    []
  );
  const communityMenus = [
    { title: "전체", url: "/communities", icon: Home },
    ...(boards?.map((board: Board) => ({
      title: board.name,
      url: `/communities/${board.slug}`,
      icon: {
        TEXT: FiFileText,
        GALLERY: FiImage,
        VIDEO: FiVideo,
        NOTICE: MdCampaign,
        LINK: FiLink,
      }[board.type],
    })) || []),
  ];
  return (
    <>
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
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {applicationMenus.map((menu) => (
                  <SidebarMenuItem key={menu.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={menu.url}
                        onClick={() => setOpenMobile(false)}
                      >
                        <menu.icon />
                        {menu.title}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>communities</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {!isLoading &&
                  communityMenus.map((menu) => (
                    <SidebarMenuItem key={menu.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={menu.url}
                          onClick={() => setOpenMobile(false)}
                        >
                          <menu.icon />
                          {menu.title}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                {isLoading &&
                  communityMenus.map((menu) => (
                    <SidebarMenuItem key={menu.title}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default MainSideMenu;
