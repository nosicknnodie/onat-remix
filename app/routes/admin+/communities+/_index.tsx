import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import DataTable from "~/components/DataTable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";
import { boardColumns } from "./_columns";

interface ICommunitiesPageProps {}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const boards = await prisma.board.findMany();

  return { boards };
};

const CommunitiesPage = (_props: ICommunitiesPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const boards = loaderData.boards?.sort((a, b) => {
    if (a.isUse === b.isUse) return 0;
    return a.isUse ? -1 : 1;
  });
  return (
    <>
      <div className="w-full">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>커뮤니티 관리</BreadcrumbItem>
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
                  <Link to={`./new`}>게시판 추가</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbList>
        </Breadcrumb>
        <DataTable data={boards} columns={boardColumns} />
      </div>
    </>
  );
};

export default CommunitiesPage;
