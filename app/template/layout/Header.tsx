import { Link, NavLink } from "@remix-run/react";
import type { ComponentProps } from "react";
import { FaUser } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts/AuthUserContext";
import { cn } from "~/libs/utils";
const Header = () => {
  const user = useSession();
  return (
    <div
      className={cn(
        "h-16 min-h-16 w-full shadow-md flex justify-center items-center sticky top-0 bg-background px-4 z-30"
      )}
    >
      <div className="max-w-screen-lg flex justify-between w-full items-center">
        <div>
          <Link to={"/"} className="">
            <div className="px-4 py-0.5">
              <img
                src="/images/logo-onsoa.png"
                alt="logo"
                className="h-8 cursor-pointer"
              />
            </div>
            {/* <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              ONSOA
            </span> */}
          </Link>
        </div>
        <div className="space-x-2 flex">
          <ListItem to="/clubs" title="클럽" />
          {/* <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <NavigationMenuLink asChild>
                    <Link
                      href={"/search"}
                      className={cn(
                        "px-1 py-0.5 text-inherit rounded-md flex items-center gap-1",
                        {
                          ["text-accent bg-accent-foreground"]:
                            pathname.startsWith("/search"),
                        }
                      )}
                      aria-disabled={pathname.startsWith("/search")}
                    >
                      <FaSearch /> 찾기
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <ListItem href="/search/club-create" title="클럽 생성">
                      직접 클럽을 생성합니다.
                    </ListItem>
                    <ListItem href="/search/club-search" title="클럽 찾기">
                      클럽을 찾을 수 있습니다.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Link
                    href={"/club"}
                    className={cn(
                      "px-1 py-0.5 text-inherit rounded-md flex items-center gap-1",
                      {
                        ["text-accent bg-accent-foreground"]:
                          pathname.startsWith("/club"),
                      }
                    )}
                    aria-disabled={pathname.startsWith("/search")}
                  >
                    <GiRibbonShield /> 클럽
                  </Link>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <ListItem href="/club" title="TEST">
                      아무말
                    </ListItem>
                    <ListItem href="/club" title="TEST">
                      확인
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu> */}
        </div>
        <div className="flex">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar>
                    <AvatarImage src={user?.userImage?.url}></AvatarImage>
                    <AvatarFallback className="bg-primary">
                      <FaUser className="text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel className="flex space-x-2">
                    <span className="text-sm">{user?.name}</span>
                    <span className="truncate text-sm font-medium">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/edit" className="text-sm">
                      회원정보 수정
                    </Link>
                  </DropdownMenuItem>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full">
                      <DropdownMenuItem className="text-sm">
                        로그아웃
                      </DropdownMenuItem>
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : user === undefined ? (
            <>
              <Avatar>
                <AvatarImage></AvatarImage>
                <AvatarFallback className="bg-primary">
                  <Loading />
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <div className="flex space-x-3">
              <Link
                to="/auth/login"
                className={cn(
                  "px-1 py-0.5 text-inherit rounded-md flex items-center gap-1"
                )}
              >
                Sign in
              </Link>{" "}
            </div>
          )}
          {/* {user ? (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar>
                  <AvatarImage
                    src={
                      user?.profile?.imageUrl
                        ? [PROFILES_URL, user.profile.imageUrl].join("/")
                        : user?.image || ""
                    }
                  />
                  <AvatarFallback>
                    <FaUser />
                  </AvatarFallback>
                </Avatar>
              }
            >
              <Dropdown.Header>
                <span className="block text-sm">{user?.name}</span>
                <span className="block truncate text-sm font-medium">
                  {user?.email}
                </span>
              </Dropdown.Header>
              <Link href="/profile">
                <Dropdown.Item>
                  <FaUser className="h-4 w-4 mr-2" />
                  프로필
                </Dropdown.Item>
              </Link>
              <Link href="/settings">
                <Dropdown.Item>
                  <GearIcon className="h-4 w-4 mr-2" />
                  설정
                </Dropdown.Item>
              </Link>
              <Dropdown.Divider />
              <LogoutButton>
                <Dropdown.Item>
                  <ExitIcon className="h-4 w-4 mr-2" />
                  로그아웃
                </Dropdown.Item>
              </LogoutButton>
            </Dropdown>
          ) : (
            <div className="space-x-2">
              <LoginButton>로그인</LoginButton> |
              <Link href={"/auth/register"}>회원가입</Link>
            </div>
          )} */}
        </div>
      </div>
    </div>
    // <Navbar fluid rounded className="drop-shadow-md">
    //   <div className="flex">
    //     <Navbar.Toggle />
    //     <Navbar.Brand as={Link} href="/">
    //       {/* <img src="/favicon.ico" className="mr-3 h-6 sm:h-9" alt="Logo" /> */}
    //       <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
    //         ⚽️ 온앗 ONAT
    //       </span>
    //     </Navbar.Brand>
    //   </div>

    //   <Navbar.Collapse>
    //     <Navbar.Link
    //       as={Link}
    //       href="/"
    //       active={pathname === "/" ? true : false}
    //     >
    //       홈
    //     </Navbar.Link>
    //     <Navbar.Link
    //       as={Link}
    //       href="/search"
    //       active={pathname.startsWith("/search") ? true : false}
    //     >
    //       찾기
    //     </Navbar.Link>
    //     <Navbar.Link
    //       as={Link}
    //       href="/club"
    //       active={pathname.startsWith("/club") ? true : false}
    //     >
    //       클럽
    //     </Navbar.Link>
    //   </Navbar.Collapse>
    // </Navbar>
  );
};

const ListItem = ({
  className,
  title,
  children,
  ...props
}: ComponentProps<typeof NavLink>) => {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "text-gray-600 relative incline-block font-semibold pt-0.5 px-2",
          "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] pt-1 pb-3 hover:bg-[length:100%_3px] transition-all",
          {
            "text-primary font-bold after:absolute after:-right-0 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
              isActive,
          }
        )
      }
      {...props}
    >
      <div className="font-medium leading-none">{title}</div>
      {/* <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        {children}
      </p> */}
    </NavLink>
  );
};

export default Header;
