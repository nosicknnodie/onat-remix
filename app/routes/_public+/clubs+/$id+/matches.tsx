/** biome-ignore-all assist/source/organizeImports: off */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Fragment } from "react/jsx-runtime";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/libs/db/db.server";

interface IMatchesPageProps {}
export const handle = { breadcrumb: "매치" };

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;
  const matcheClubs = await prisma.matchClub.findMany({
    where: {
      clubId,
    },
    include: {
      club: { include: { image: true, emblem: true } },
      match: true,
    },
  });
  return { matcheClubs };
};

/**
 * 1. 경기 매치리스트를 보여준다.
 * 2. 매치 카드에는 각 정보들이 들어있다.
 *    - 타이틀 title
 *    - 설명 description
 *    - 경기 장소 placeName (예: 계남초등학교)
 *    - 주소 address
 *    - 시작시간 stDate
 *    - 자체전여부 isSelf
 *
 * @param _props
 * @returns
 */
const MatchesPage = (_props: IMatchesPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  // const params = useParams();
  const matchClubs = loaderData.matcheClubs;
  // const clubId = params.id;

  return (
    <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 gap-4 p-2">
      {matchClubs.map((matchClub) => {
        const match = matchClub.match;
        return (
          <Link
            key={matchClub.id}
            to={`/matches/${matchClub.matchId}${matchClub.id ? `/clubs/${matchClub.id}` : ""}`}
          >
            <Card className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
                <div className="space-y-1 w-full min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">{match.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2 overflow-hidden break-words w-full">
                    {match.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {matchClubs.map((matchClub, i) => (
                    <Fragment key={matchClub.id}>
                      {i !== 0 && (
                        <div className="flex whitespace-nowrap items-center text-sm font-semibold">
                          <span className="text-primary">vs</span>
                        </div>
                      )}
                      <div className="flex whitespace-nowrap items-center text-sm font-semibold gap-1">
                        <Avatar>
                          <AvatarImage
                            src={matchClub.club?.emblem?.url ?? "/images/club-default-emblem.webp"}
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
    </div>
  );
};

export default MatchesPage;
