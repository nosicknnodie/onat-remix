import type { Board } from "@prisma/client";
import { useLocation, useMatches, useNavigate } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Home } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight, FaUser } from "react-icons/fa";
import {
  HiOutlineArrowsUpDown,
  HiOutlineInformationCircle,
  HiOutlineNewspaper,
  HiOutlineSquares2X2,
  HiOutlineUsers,
} from "react-icons/hi2";
import { MdGroups2 } from "react-icons/md";
import { TbSoccerField } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { useSession } from "~/contexts";
import type { ClubWithMembership, IClubLayoutLoaderData } from "~/features/clubs/isomorphic";
import { clubInfoQueryKeys } from "~/features/clubs/isomorphic";
import { cn, getBoardIcon } from "~/libs";
import { getJson } from "~/libs/api-client";
import ItemLink from "../ItemLink";

const currentClubIdAtom = atomWithStorage<string | null>("currentClub", null);
const myClubsQueryKey = clubInfoQueryKeys.myClubs();

const MainSideMenu = () => {
  const { open, toggleSidebar, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["BOARDS_MENU_QUERY"],
    queryFn: async () => await (await fetch("/api/boards")).json(),
  });
  const user = useSession();
  const { data: clubsData = [], isLoading: isClubsLoading } = useQuery<ClubWithMembership[]>({
    queryKey: myClubsQueryKey,
    queryFn: () =>
      getJson<ClubWithMembership[]>("/api/clubs/my", {
        auth: true,
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
  });

  const matches = useMatches();
  const clubLayoutMatch = useMemo(
    () => matches.find((match) => match.id === "routes/_public+/clubs+/$id+/_layout"),
    [matches],
  );
  const clubLayoutData = clubLayoutMatch?.data as IClubLayoutLoaderData | undefined;
  const layoutClubId = clubLayoutData?.club?.id ?? null;

  const [currentClubId, setCurrentClubId] = useAtom(currentClubIdAtom);
  const [isClubSwitcherOpen, setClubSwitcherOpen] = useState(false);
  const clubs = useMemo(() => (Array.isArray(clubsData) ? clubsData : []), [clubsData]);
  const joinedClubs = useMemo(
    () =>
      clubs.filter((club) => {
        const status = club.membership?.status;
        if (!status) return false;
        return !["REJECTED", "LEFT", "BANNED"].includes(status);
      }),
    [clubs],
  );

  useEffect(() => {
    if (isClubsLoading) return;

    if (!clubs.length) {
      if (currentClubId !== null) {
        setCurrentClubId(null);
      }
      return;
    }

    const preferredClubId = layoutClubId ?? currentClubId;
    const nextClubId =
      clubs.find((club) => club.id === preferredClubId)?.id ?? clubs[0]?.id ?? null;
    if (nextClubId !== currentClubId) {
      setCurrentClubId(nextClubId);
    }
  }, [clubs, currentClubId, isClubsLoading, layoutClubId, setCurrentClubId]);

  const selectedClub = useMemo(() => {
    if (!clubs.length) return null;
    return clubs.find((club) => club.id === currentClubId) ?? clubs[0] ?? null;
  }, [clubs, currentClubId]);

  const boards = data?.boards as Board[] | undefined;
  const communityMenus = [
    { title: "전체", url: "/communities", icon: <Home className="text-primary" />, end: true },
    ...(boards?.map((board) => ({
      title: board.name,
      url: `/communities/${board.slug}`,
      icon: getBoardIcon(board.type),
      end: false,
    })) || []),
  ];
  const handleMenuClick = useCallback(
    (url: string) => {
      setOpenMobile(false);
      navigate(url);
    },
    [navigate, setOpenMobile],
  );

  const handleClubClick = (clubId: string) => {
    setCurrentClubId(clubId);
    handleMenuClick(`/clubs/${clubId}`);
  };

  const handleClubSelection = (clubId: string) => {
    setCurrentClubId(clubId);
    setClubSwitcherOpen(false);
    handleMenuClick(`/clubs/${clubId}`);
  };

  const userInitial = useMemo(() => {
    if (!user) return "";
    if (user.name) return user.name[0]?.toUpperCase() ?? "";
    if (user.email) return user.email[0]?.toUpperCase() ?? "";
    return "";
  }, [user]);

  return (
    <Dialog open={isClubSwitcherOpen} onOpenChange={setClubSwitcherOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="mt-20 px-4">
          <SidebarContent>
            <div className={cn("flex items-center justify-between gap-2")}>
              <div className={cn("flex items-center gap-3", { hidden: !open })}>
                <Avatar className="size-10">
                  <AvatarImage src={user?.userImage?.url ?? undefined} alt={user?.name ?? "user"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitial || <FaUser className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {user?.name ? (
                      user.name
                    ) : (
                      <>
                        {typeof user === "undefined" ? (
                          ""
                        ) : (
                          <ItemLink to="/auth/login">로그인이 필요합니다</ItemLink>
                        )}
                      </>
                    )}
                  </span>
                  {user?.email && (
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  )}
                </div>
              </div>
              <Button
                onClick={toggleSidebar}
                size="icon"
                variant="ghost"
                className="transition-transform hover:bg-transparent"
              >
                {open ? <FaArrowAltCircleLeft /> : <FaArrowAltCircleRight />}
              </Button>
            </div>
          </SidebarContent>
        </SidebarHeader>
        <SidebarSeparator className="mt-4" />
        <SidebarContent className="pt-3">
          <SidebarGroup>
            <SidebarGroupLabel>내 정보</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/dashboard")}
                    isActive={location.pathname.startsWith("/dashboard")}
                  >
                    <HiOutlineSquares2X2 />
                    <span className="text-sm">대시보드</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>나의 클럽</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isClubsLoading && (
                  <Fragment>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="h-full w-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="h-full w-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Fragment>
                )}
                {!isClubsLoading && clubs.length === 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled className="justify-start">
                      <MdGroups2 />
                      가입한 클럽이 없습니다.
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {!isClubsLoading &&
                  clubs.map((club) => {
                    const baseUrl = `/clubs/${club.id}`;
                    const isActive =
                      selectedClub?.id === club.id || location.pathname.startsWith(baseUrl);
                    const membership =
                      clubLayoutData?.club?.id === club.id
                        ? clubLayoutData.player
                        : club.membership;
                    const isJoined = !!membership;
                    // const isAdmin = membership?.role === "MANAGER" || membership?.role === "MASTER";
                    const subItems = [
                      {
                        label: "정보",
                        url: baseUrl,
                        isActive: location.pathname === baseUrl,
                        visible: true,
                        icon: HiOutlineInformationCircle,
                      },
                      {
                        label: "게시판",
                        url: `${baseUrl}/boards`,
                        isActive: location.pathname.startsWith(`${baseUrl}/boards`),
                        visible: isJoined,
                        icon: HiOutlineNewspaper,
                      },
                      {
                        label: "매치",
                        url: `${baseUrl}/matches`,
                        isActive: location.pathname.startsWith(`${baseUrl}/matches`),
                        visible: isJoined,
                        icon: TbSoccerField,
                      },
                      {
                        label: "멤버",
                        url: `${baseUrl}/members/approved`,
                        isActive: location.pathname.startsWith(`${baseUrl}/members`),
                        visible: isJoined,
                        icon: HiOutlineUsers,
                      },
                      // {
                      //   label: "승인대기",
                      //   url: `${baseUrl}/members/pendings`,
                      //   isActive: location.pathname.startsWith(`${baseUrl}/pendings`),
                      //   visible: isAdmin,
                      //   icon: HiOutlineClock,
                      // },
                    ].filter((item) => item.visible);

                    return (
                      <Fragment key={club.id}>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => handleClubClick(club.id)}
                            isActive={isActive}
                            className="justify-start"
                          >
                            <MdGroups2 />
                            <span className="flex-1 truncate">{club.name}</span>
                          </SidebarMenuButton>
                          {club.id === selectedClub?.id && joinedClubs.length > 0 && (
                            <DialogTrigger asChild>
                              <SidebarMenuAction asChild>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                  }}
                                  className="flex size-6 items-center justify-center rounded-md text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                  <HiOutlineArrowsUpDown className="h-4 w-4" />
                                </button>
                              </SidebarMenuAction>
                            </DialogTrigger>
                          )}
                        </SidebarMenuItem>
                        {isActive &&
                          subItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <SidebarMenuItem key={item.url}>
                                <SidebarMenuButton
                                  onClick={() => handleMenuClick(item.url)}
                                  isActive={item.isActive}
                                  className="justify-start pl-8"
                                  size="sm"
                                >
                                  <Icon
                                    className={`h-4 w-4 ${item.isActive ? "" : "text-muted-foreground"}`}
                                  />
                                  <span>{item.label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                      </Fragment>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>전체</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/clubs")}
                    isActive={location.pathname === "/clubs"}
                  >
                    <MdGroups2 />
                    공개 클럽
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick("/matches")}
                    isActive={location.pathname.startsWith("/matches")}
                  >
                    <TbSoccerField />
                    공개 매치
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>커뮤니티</SidebarGroupLabel>
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
                        {menu.icon}
                        {menu.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                {isLoading && (
                  <Fragment>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="h-full w-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Skeleton className="h-full w-full" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Fragment>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator className="mt-auto" />
        <SidebarFooter className="mt-4 pb-6">
          <SidebarContent>
            <div className={cn("text-xs text-muted-foreground leading-relaxed", { hidden: !open })}>
              <p className="font-semibold">© {new Date().getFullYear()} ONSOA</p>
              <p className="truncate text-xs">함께 만드는 축구 커뮤니티</p>
            </div>
          </SidebarContent>
        </SidebarFooter>
      </Sidebar>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>클럽 전환</DialogTitle>
          <DialogDescription>
            가입한 클럽을 선택하면 해당 클럽 페이지로 이동합니다.
          </DialogDescription>
        </DialogHeader>
        {joinedClubs.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            {joinedClubs.map((club) => (
              <Button
                key={club.id}
                variant={club.id === currentClubId ? "secondary" : "outline"}
                className="justify-start"
                onClick={() => handleClubSelection(club.id)}
              >
                <MdGroups2 className="mr-2" />
                {club.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">가입된 클럽이 없습니다.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MainSideMenu;
