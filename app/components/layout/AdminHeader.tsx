import { Link } from "@remix-run/react";
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
import { useSession } from "~/contexts";
import { cn } from "~/libs";

const Header = () => {
  const user = useSession();
  const displayName = user?.nick || user?.name || "";
  return (
    <div
      className={cn(
        "h-16 min-h-16 w-full shadow-md flex justify-center items-center sticky top-0 bg-background px-4 z-30",
      )}
    >
      <div className="flex justify-between w-full items-center">
        <div>
          <Link to={"/admin"} className="">
            <div className="px-4 py-0.5 flex items-center gap-x-2">
              <img src="/images/logo-onsoa.png" alt="logo" className="h-8 cursor-pointer" />
              <span className="font-semibold text-lg">ADMIN</span>
            </div>
          </Link>
        </div>
        <div className="flex">
          {user ? (
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
                  <span className="text-sm">{displayName}</span>
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
          ) : user === undefined ? (
            <Avatar>
              <AvatarImage></AvatarImage>
              <AvatarFallback className="bg-primary">
                <Loading />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex space-x-3">
              <Link
                to="/auth/login"
                className={cn("px-1 py-0.5 text-inherit rounded-md flex items-center gap-1")}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
