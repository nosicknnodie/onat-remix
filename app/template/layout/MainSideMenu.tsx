import { Board } from "@prisma/client";
import { useLocation, useNavigate } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { FiFileText, FiImage, FiLink, FiVideo } from "react-icons/fi";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { MdCampaign, MdGroups2 } from "react-icons/md";
import { TbSoccerField } from "react-icons/tb";
import { Fragment } from "react/jsx-runtime";
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
import { Skeleton } from "~/components/ui/skeleton";
interface IMainSideMenuProps {}
const MainSideMenu = (_props: IMainSideMenuProps) => {
  const { open, toggleSidebar, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["BOARDS_MENU_QUERY"],
    queryFn: async () => {
      return await fetch("/api/boards").then((res) => res.json());
    },
  });
  const boards = data?.boards;

  const communityMenus = [
    { title: "전체", url: "/communities", icon: Home, end: true },
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
      end: false,
    })) || []),
  ];
  const handleMenuClick = (url: string) => {
    setOpenMobile(false);
    navigate(url);
  };

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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/dashboard")}
                    isActive={location.pathname.startsWith("/dashboard")}
                  >
                    <HiOutlineSquares2X2 />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/clubs")}
                    isActive={location.pathname.startsWith("/clubs")}
                  >
                    <MdGroups2 />
                    클럽
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/matches")}
                    isActive={location.pathname.startsWith("/matches")}
                  >
                    <TbSoccerField />
                    매치
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>communities</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {!isLoading &&
                  communityMenus.map((menu) => (
                    <SidebarMenuItem key={menu.url}>
                      <SidebarMenuButton
                        onClick={() => handleMenuClick(menu.url)}
                        isActive={
                          menu.end
                            ? location.pathname === menu.url
                            : location.pathname.startsWith(menu.url)
                        }
                      >
                        <menu.icon />
                        {menu.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                {isLoading && (
                  <Fragment>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="w-full h-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="w-full h-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Fragment>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default MainSideMenu;
