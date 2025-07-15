import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, Outlet } from "@remix-run/react";
import { BreadcrumbLink } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/libs/utils";

export const handle = {
  breadcrumb: () => {
    return (
      <>
        <BreadcrumbLink to="/matches">매치</BreadcrumbLink>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0"
              )}
            >
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/matches/new">매치 생성</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  },
};

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default Layout;
