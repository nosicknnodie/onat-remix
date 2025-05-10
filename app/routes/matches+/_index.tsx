import { Club, Match, MatchClub } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const matches = await prisma.match.findMany({
    include: {
      matchClubs: {
        include: {
          club: { include: { image: true, emblem: true } },
        },
      },
    },
  });
  return Response.json({ matches });
};

interface IMatchsPageProps {}

interface IMatchsPageLoaderData {
  matches: (Match & {
    matchClubs: (MatchClub & {
      club: Club & { image?: { url: string } | null; emblem?: { url: string } | null };
    })[];
  })[];
}

const MatchsPage = (_props: IMatchsPageProps) => {
  const loaderData = useLoaderData<IMatchsPageLoaderData>();
  const matches = useMemo(() => loaderData.matches ?? [], [loaderData.matches]);
  const values = matches.sort(
    (a, b) => new Date(a.stDate!).getTime() - new Date(b.stDate!).getTime(),
  );
  return (
    <>
      <div className="flex flex-col justify-start w-full space-y-2">
        <Breadcrumb>
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
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4">
          {values?.map((match) => (
            <Link key={match.id} to={`/matches/${match.id}`}>
              <Card
                key={match.id}
                className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
                  <div className="space-y-1 w-full min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">{match.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2 overflow-hidden break-words w-full">
                      {match.description}
                    </CardDescription>
                  </div>
                  {/* {match.matchClubs[0]?.isSelf && (
                  <span
                    className={`text-xs h-fit px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      match.matchClubs[0]?.isSelf
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {match.matchClubs[0]?.isSelf ? "자체전" : "매치전"}
                  </span>
                )} */}
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
                                matchClub.club?.emblem?.url ?? "/images/club-default-emblem.webp"
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
          ))}
          {/* <MatchCard match={{} as MatchClub & { MatchClub: MatchClub[] }} /> */}
        </div>
      </div>
    </>
  );
};

export default MatchsPage;
