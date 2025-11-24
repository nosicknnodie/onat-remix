import { FaCrown, FaUser } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/libs";
import type { RatingStatsItem } from "../isomorphic";
import { getAttendanceDisplayName } from "../isomorphic";

export function RatingStatsListItem({
  stats,
  rank,
  matchStartDate,
}: {
  stats: RatingStatsItem;
  rank: number;
  matchStartDate: Date;
}) {
  const isPerception = stats.attendance.checkTime
    ? new Date(matchStartDate) < new Date(stats.attendance.checkTime)
    : false;
  return (
    <div
      className={cn(
        "flex justify-between gap-2 text-sm rounded-3xl px-4 py-1 hover:bg-primary/10 transform",
      )}
    >
      <div className="flex gap-2">
        <div className="flex justify-center items-center min-w-6">{rank}</div>
        <Avatar
          className={cn("shadow-md shadow-yellow-100", {
            "border-yellow-300 border": rank === 1,
            "border-gray-300 border": rank === 2,
            "border-orange-300 border": rank === 3,
          })}
        >
          <AvatarImage src={stats.attendance?.player?.user?.userImage?.url}></AvatarImage>
          <AvatarFallback className="bg-primary">
            <FaUser className="text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start justify-center">
          <p className="font-semibold text-sm drop-shadow-sm">
            {getAttendanceDisplayName(stats?.attendance)}
          </p>
          <div className="text-sm drop-shadow-sm">
            <Badge variant="outline" className="h-4 text-gray-400">
              {
                {
                  CHAIRMAN: "회장",
                  VICE_CHAIRMAN: "부회장",
                  GENERAL_AFFAIRS: "총무",
                  ASSISTANT_GENERAL_AFFAIRS: "부총무",
                  DIRECTOR: "감독",
                  COACH: "코치",
                  OPERATOR: "운영",
                  ADVISER: "고문",
                  NO: "회원",
                }[stats?.attendance.player?.jobTitle ?? "NO"]
              }
            </Badge>
            {isPerception && <Badge className="h-4">지각</Badge>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 items-end">
          <StarRating
            id={`${stats.attendance.id}-star-id`}
            score={stats.averageRating}
            width={20}
            isHighLight
          />
          <span className="text-xs ">{((stats?.averageRating ?? 0) / 20).toFixed(2)}</span>
          <span className="text-xs max-sm:hidden sm:block">{stats.voterCount} voters</span>
        </div>
        <div className="flex items-end gap-2 text-xs text-muted-foreground">
          <FiHeart className="text-pink-500" />
          <span className="text-foreground">{stats.likeCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

export function RatingStatsCard({ stats, rank }: { stats?: RatingStatsItem; rank?: 1 | 2 | 3 }) {
  if (!stats) {
    return (
      <div
        className={cn({
          "w-full min-w-32": rank === 1,
          "w-full min-w-20": rank === 2 || rank === 3,
        })}
      ></div>
    );
  }
  return (
    <div className="flex flex-col justify-center items-center w-full gap-2">
      <div className="font-semibold text-sm drop-shadow-sm flex gap-1 items-center">
        <FaCrown
          className={cn({
            "text-yellow-300": rank === 1,
            "text-gray-300": rank === 2,
            "text-orange-300": rank === 3,
          })}
        />

        <span>{getAttendanceDisplayName(stats?.attendance)}</span>
      </div>
      <div
        className={cn("h-32 relative w-full flex justify-center", {
          "h-20": rank !== 1,
        })}
      >
        <Avatar
          className={cn("border-primary border-2 shadow-md shadow-yellow-100", {
            "border-yellow-300 size-32": rank === 1,
            "border-gray-300 size-20 ": rank === 2,
            "border-orange-300 size-20 ": rank === 3,
          })}
        >
          <AvatarImage src={stats?.attendance?.player?.user?.userImage?.url}></AvatarImage>
          <AvatarFallback className="bg-primary">
            <FaUser className="text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "bg-primary rounded-full w-6 h-6 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center text-white font-semibold",
            {
              "bg-yellow-300 text-black": rank === 1,
              "bg-gray-300 text-black": rank === 2,
              "bg-orange-300 text-black": rank === 3,
            },
          )}
        >
          {rank}
        </div>
      </div>
      <div className="flex gap-2 mt-2 items-end">
        <StarRating
          id={`${stats?.attendance.id}-star-id`}
          score={stats?.averageRating}
          width={20}
          isHighLight
        />
        <span className="text-xs ">{((stats?.averageRating ?? 0) / 20).toFixed(2)}</span>
      </div>
      <div className="flex items-end">
        <p className="text-xs italic text-gray-600">{stats.voterCount} voters</p>
      </div>
    </div>
  );
}
