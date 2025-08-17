import type { Match, MatchClub } from "@prisma/client";
import dayjs from "dayjs";
import { HiClock, HiHome, HiLocationMarker } from "react-icons/hi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface IMatchCardProps {
  match: Match & { matchClubs: MatchClub[] };
}

const MatchCard = ({ match }: IMatchCardProps) => {
  return (
    <>
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
          {match.matchClubs[0]?.isSelf && (
            <span
              className={`text-xs h-fit px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                match.matchClubs[0]?.isSelf
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {match.matchClubs[0]?.isSelf ? "자체전" : "매치전"}
            </span>
          )}
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
              {dayjs(match.stDate).format("YYYY-MM-DD HH:mm")}
            </span>
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default MatchCard;
