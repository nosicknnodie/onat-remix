import { Prisma } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import {
  HiClock,
  HiHome,
  HiLocationMarker,
  HiOutlineArchive,
  HiOutlineCalendar,
  HiOutlinePlay,
  HiOutlineSun,
} from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useSession } from "~/contexts/AuthUserContext";
import { prisma } from "~/libs/db/db.server";
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
  );
};

export const handle = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  right: (match: any) => <RightComponent {...match} />,
};

type MatchWithClub = Prisma.MatchGetPayload<{
  include: {
    matchClubs: {
      include: {
        club: {
          include: {
            image: true;
            emblem: true;
          };
        };
      };
    };
  };
}>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  const [matches, myClubs] = await Promise.all([
    prisma.match.findMany({
      include: {
        matchClubs: {
          include: {
            club: { include: { image: true, emblem: true } },
          },
        },
      },
    }),
    user?.id
      ? prisma.player.findMany({
          where: { userId: user.id, status: "APPROVED" },
          select: { clubId: true },
        })
      : [],
  ]);

  // 오늘 날짜 기준
  const now = new Date();
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  const myClubIds = myClubs.map((c) => c.clubId);

  // 분류
  const myMatches = matches.filter((m) =>
    m.matchClubs.some((mc) => myClubIds.includes(mc.clubId))
  );
  const publicMatches = matches.filter(
    (m) => !m.matchClubs.some((mc) => myClubIds.includes(mc.clubId))
  );
  const categorized = {
    my: {
      today: myMatches.filter((m) => {
        const date = new Date(m.stDate!);
        return date >= startOfToday && date <= endOfToday;
      }),
      upcoming: myMatches.filter((m) => new Date(m.stDate!) > endOfToday),
      past: myMatches.filter((m) => new Date(m.stDate!) < startOfToday),
    },
    public: {
      upcoming: publicMatches.filter((m) => new Date(m.stDate!) > now),
      ongoing: publicMatches.filter((m) => {
        const date = new Date(m.stDate!);
        return date >= startOfToday && date <= endOfToday;
      }),
    },
  };

  return { categorized, myClubIds };
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
                    "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
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
                  "data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:after:absolute data-[state=active]:after:-right-0 data-[state=active]:after:-top-0.5 data-[state=active]:after:content-[''] data-[state=active]:after:w-2 data-[state=active]:after:h-2 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
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

                <MatchList
                  matches={categorized.my.past}
                  myClubIds={myClubIds}
                  title="지난 매치"
                />
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

const MatchList = ({
  matches,
  myClubIds,
  title,
}: {
  matches: MatchWithClub[];
  myClubIds: string[];
  title: React.ReactNode;
}) => {
  if (!matches.length) return null;
  return (
    <>
      <h3 className="text-lg font-semibold mt-4 mb-1 flex items-center gap-2">
        {{
          "오늘자 매치": <HiOutlineSun className="text-primary" />,
          "다가올 매치": <HiOutlineCalendar className="text-primary" />,
          "지난 매치": <HiOutlineArchive className="text-primary" />,
          "진행 중인 매치": <HiOutlinePlay className="text-primary" />,
        }[String(title)] ?? null}
        {title}
      </h3>
      <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
        {matches?.map((match) => {
          const matchClubId = match.matchClubs.find((mc) =>
            myClubIds.includes(mc.clubId)
          )?.id;
          return (
            <Link
              key={match.id}
              to={`/matches/${match.id}${matchClubId ? `/clubs/${matchClubId}` : ""}`}
            >
              <Card
                key={match.id}
                className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
                  <div className="space-y-1 w-full min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {match.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2 overflow-hidden break-words w-full">
                      {match.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {match.matchClubs.map((matchClub, i) => (
                      <Fragment key={matchClub.id}>
                        {i !== 0 && (
                          <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                            <span className="text-primary">vs</span>
                          </div>
                        )}
                        <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                          <Avatar>
                            <AvatarImage
                              src={
                                matchClub.club?.emblem?.url ??
                                "/images/club-default-emblem.webp"
                              }
                            />
                            <AvatarFallback className="bg-primary">
                              <Loading />
                            </AvatarFallback>
                          </Avatar>
                          <span>{matchClub.club?.name}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <HiLocationMarker className="text-base text-primary" />
                    <span className="text-foreground">{match.placeName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiHome className="text-base text-primary" />
                    <span className="text-foreground">{match.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HiClock className="text-base text-primary" />
                    <span className="text-foreground">
                      {dayjs(match.stDate).format("YYYY-MM-DD (ddd) HH:mm")}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {/* <MatchCard match={{} as MatchClub & { MatchClub: MatchClub[] }} /> */}
      </div>
    </>
  );
};

export default MatchsPage;
