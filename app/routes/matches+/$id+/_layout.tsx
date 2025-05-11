import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  Link,
  Outlet,
  UIMatch,
  useLoaderData,
  useMatches,
  useNavigate,
  useParams,
} from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";

import { Club, Match, MatchClub } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import ItemLink from "~/components/ItemLink";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSession } from "~/contexts/AuthUserContext";
import { getUser } from "~/libs/db/lucia.server";
interface IMatchesIdLayoutPageProps {}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  // const club = await prisma.club.findUnique({
  //   where: {
  //     id: params.id,
  //   },
  //   include: {
  //     image: { select: { url: true } },
  //     emblem: { select: { url: true } },
  //   },
  // });
  const [match] = await Promise.all([
    prisma.match.findUnique({
      where: {
        id: params.id,
      },
      include: {
        matchClubs: {
          include: {
            club: { include: { image: true, emblem: true } },
          },
          where: {
            club: {
              players: {
                some: {
                  userId: user?.id,
                  status: "APPROVED",
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!match) {
    throw redirect("/404");
  }

  return Response.json({ match });
}

export type IMatchLayoutLoaderData = {
  match: Match & {
    matchClubs: (MatchClub & {
      club: Club & { image?: { url: string } | null; emblem?: { url: string } | null };
    })[];
  };
};

const MatchesIdLayoutPage = (_props: IMatchesIdLayoutPageProps) => {
  const user = useSession();
  const data = useLoaderData<IMatchLayoutLoaderData>();
  const matches = useMatches() as UIMatch<unknown, { breadcrumb?: React.ReactNode }>[];
  const params = useParams();
  const navigate = useNavigate();
  const [selectedMatchClubId, setSelectedMatchClubId] = useState<string>("");
  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      name: match.handle.breadcrumb,
      path: match.pathname.endsWith("/") ? match.pathname.slice(0, -1) : match.pathname,
    }));
  const match = data.match;
  const matchClubs = match.matchClubs;
  useEffect(() => {
    if (matchClubs.length > 0) {
      const selectedId = params?.matchClubId || "";
      setSelectedMatchClubId(selectedId);
    }
  }, [matchClubs, params]);

  const handleSelectedMatchClubIdChange = (id: string) => {
    navigate(`/matches/${params.id}/clubs/${id}`);
    setSelectedMatchClubId(id);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to="/matches">매치</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to={"/matches/" + params.id}>{data.match.title}</BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((breadcrumb) => (
                <Fragment key={breadcrumb.path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink to={breadcrumb.path}>{breadcrumb.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              ))}
              <BreadcrumbItem>
                {data.match.createUserId === user?.id && (
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
                        <Link to={`/matches/${params.id}/edit`}>매치 수정</Link>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem asChild>
                        <Link to={"/matches/new"}>매치 추가</Link>
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {/* 매치정보 Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              {/* 오른쪽: 매치 제목/설명 */}
              <div className="">
                <CardTitle className="text-base sm:text-lg">{match.title}</CardTitle>
                <CardDescription className="">{match.description}</CardDescription>
              </div>
              {/* 왼쪽: 클럽 정보 */}
              <div className="flex items-center space-x-2">
                {matchClubs.map((matchClub, i) => (
                  <Fragment key={matchClub.id}>
                    {i !== 0 && (
                      <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                        <span className="text-primary">vs</span>
                      </div>
                    )}
                    <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                      <ItemLink
                        to={`/matches/${params.id}/clubs/${matchClub.id}`}
                        className="flex gap-x-2 items-center"
                      >
                        <Avatar>
                          <AvatarImage
                            src={matchClub.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
                          />
                          <AvatarFallback className="bg-primary">
                            <Loading />
                          </AvatarFallback>
                        </Avatar>
                        <span>{matchClub.club?.name}</span>
                      </ItemLink>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between max-sm:flex-col gap-2">
              <div>
                <p className="flex items-center gap-2 ">
                  <HiLocationMarker className="text-base text-primary" />
                  <span className="text-foreground text-sm">{match.placeName}</span>
                </p>
                <p className="flex items-center gap-2">
                  <HiHome className="text-base text-primary" />
                  <span className="text-foreground text-sm">{match.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <HiClock className="text-base text-primary" />
                  <span className="text-foreground text-sm">
                    {dayjs(match.stDate).format("YYYY-MM-DD (ddd) HH:mm")}
                  </span>
                </p>
              </div>
              <div className="flex items-end">
                <Select value={selectedMatchClubId} onValueChange={handleSelectedMatchClubIdChange}>
                  <SelectTrigger className="min-w-[120px] max-sm:w-full">
                    <SelectValue placeholder="클럽 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchClubs.map((matchClub) => (
                      <SelectItem key={matchClub.id} value={matchClub.id}>
                        {matchClub.club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Outlet context={{ match: data.match }} />
      </div>
    </>
  );
};

export default MatchesIdLayoutPage;
