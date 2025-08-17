import { Link } from "@remix-run/react";
import { FaUser } from "react-icons/fa";
import { IoIosMenu } from "react-icons/io";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSidebar } from "~/components/ui/sidebar";
import { useSession } from "~/contexts/AuthUserContext";
import { cn } from "~/libs/utils";

const Header = () => {
  const user = useSession();
  const { toggleSidebar } = useSidebar();
  return (
    <header
      className={cn(
        "h-16 min-h-16 w-full shadow-md flex justify-center items-center sticky top-0 bg-background px-4 z-30",
      )}
    >
      <div className="flex justify-between w-full items-center">
        <div className="flex">
          <div className="md:hidden">
            <Button variant={"ghost"} size={"icon"} onClick={toggleSidebar}>
              <IoIosMenu className="size-6" />
            </Button>
          </div>
          <Link to={"/"} className="">
            <div className="px-4 py-0.5">
              <img src="/images/logo-onsoa.png" alt="logo" className="h-8 cursor-pointer" />
            </div>
            {/* <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              ONSOA
            </span> */}
          </Link>
        </div>
        <div className="space-x-2 flex"></div>
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
                    <span className="truncate text-sm font-medium">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/edit" className="text-sm">
                      회원정보 수정
                    </Link>
                  </DropdownMenuItem>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full">
                      <DropdownMenuItem className="text-sm">로그아웃</DropdownMenuItem>
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
                className={cn("px-1 py-0.5 text-inherit rounded-md flex items-center gap-1")}
              >
                Sign in
              </Link>{" "}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// const ListItem = ({
//   className,
//   title,
//   children,
//   ...props
// }: ComponentProps<typeof NavLink>) => {
//   return (
//     <NavLink
//       className={({ isActive }) =>
//         cn(
//           "text-gray-600 relative incline-block font-semibold pt-0.5 px-2",
//           "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] pt-1 pb-3 hover:bg-[length:100%_3px] transition-all",
//           {
//             "text-primary font-bold after:absolute after:-right-0 after:-top-0.5 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full":
//               isActive,
//           }
//         )
//       }
//       {...props}
//     >
//       <div className="font-medium leading-none">{title}</div>
//     </NavLink>
//   );
// };

export default Header;
