import { Link } from "@remix-run/react";
import dayjs from "dayjs";
import { Fragment } from "react/jsx-runtime";
import {
  HiClock,
  HiHome,
  HiLocationMarker,
  HiOutlineArchive,
  HiOutlineCalendar,
  HiOutlinePlay,
  HiOutlineSun,
} from "react-icons/hi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { MatchWithClub } from "../isomorphic/match.types";

export function MatchList({
  matches,
  myClubIds,
  title,
}: {
  matches: MatchWithClub[];
  myClubIds: string[];
  title: React.ReactNode;
}) {
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
          const matchClub = match.matchClubs.find((mc) => myClubIds.includes(mc.clubId));
          const matchClubId = matchClub?.id;
          return (
            <Link key={match.id} to={`/clubs/${matchClub?.clubId}/matches/${matchClubId}`}>
              <Card
                key={match.id}
                className="col-span-1 flex flex-col border border-gray-200 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 min-w-0 flex-1">
                  <div className="space-y-1 w-full min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">{match.title}</CardTitle>
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
          );
        })}
      </div>
    </>
  );
}
