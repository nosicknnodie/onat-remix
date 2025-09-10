/** biome-ignore-all lint/suspicious/noExplicitAny: off */
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useSession } from "~/contexts";
import { MatchList } from "~/features/matches";
import { list as matches } from "~/features/matches/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";

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
  const data = await matches.service.getIndexData(user?.id);
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
          {/* 나의 클럽 섹션 */}
          <Tabs defaultValue={session ? "my" : "public"} className="flex-1">
            <TabsList className="bg-transparent  space-x-2">
              {session && (
                <TabsTrigger
                  value="my"
                  className={cn(
                    "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                    "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                    "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
                  )}
                >
                  나의 클럽 매치
                </TabsTrigger>
              )}
              <TabsTrigger
                value="public"
                className={cn(
                  "text-foreground pb-1 relative incline-block font-semibold hover:text-primary",
                  "bg-[linear-gradient(hsl(var(--primary)),_hsl(var(--primary)))] bg-no-repeat bg-bottom bg-[length:0_3px] py-1 hover:bg-[length:100%_3px] transition-all",
                  "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full",
                )}
              >
                공개 클럽 매치
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my">
              <section>
                <MatchList
                  matches={categorized.my.today}
                  myClubIds={myClubIds}
                  title="오늘자 매치"
                />

                <MatchList
                  matches={categorized.my.upcoming}
                  myClubIds={myClubIds}
                  title="다가올 매치"
                />

                <MatchList matches={categorized.my.past} myClubIds={myClubIds} title="지난 매치" />
              </section>
            </TabsContent>
            <TabsContent value="public">
              {/* 공개 매치 섹션 */}
              <section>
                <MatchList
                  matches={categorized.public.ongoing}
                  myClubIds={[]}
                  title="진행 중인 매치"
                />
                <MatchList
                  matches={categorized.public.upcoming}
                  myClubIds={[]}
                  title="다가올 매치"
                />
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

// MatchList is now provided by features/matches/ui

export default MatchsPage;
