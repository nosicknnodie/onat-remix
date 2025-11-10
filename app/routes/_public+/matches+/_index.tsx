/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts";
import { MatchList } from "~/features/matches/client";
import { listSerivce } from "~/features/matches/server";
import { cn } from "~/libs";
import { getUser } from "~/libs/index.server";

const RightComponent = () => {
  const session = useSession();
  if (!session) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
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
  );
};

export const handle = {
  right: (match: any) => <RightComponent {...match} />,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const data = await listSerivce.getIndexData(user?.id);
  return data;
};

interface IMatchsPageProps {}

const MatchsPage = (_props: IMatchsPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const session = useSession();
  const myClubIds = loaderData.myClubIds ?? [];
  const categorized = loaderData.categorized;
  return (
    <>
      <div className="flex flex-col justify-start w-full space-y-2">
        {/* <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
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
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}
        <div className="space-y-8">
          {session && (
            <section className="space-y-6">
              <Badge variant="outline" className="w-fit border-primary text-primary">
                나의 클럽 매치
              </Badge>
              <MatchList matches={categorized.my.today} myClubIds={myClubIds} title="오늘자 매치" />
              <MatchList
                matches={categorized.my.upcoming}
                myClubIds={myClubIds}
                title="다가올 매치"
              />
              <MatchList matches={categorized.my.past} myClubIds={myClubIds} title="지난 매치" />
            </section>
          )}

          <section className="space-y-6">
            <Badge variant="outline" className="w-fit border-primary text-primary">
              공개 클럽 매치
            </Badge>
            <MatchList matches={categorized.public.ongoing} myClubIds={[]} title="진행 중인 매치" />
            <MatchList matches={categorized.public.upcoming} myClubIds={[]} title="다가올 매치" />
          </section>
        </div>
      </div>
    </>
  );
};

// MatchList is now provided by features/matches/ui

export default MatchsPage;
