import { FaCrown, FaUser } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/libs/isomorphic";
import type { AttendanceNameSource } from "../isomorphic";
import { getAttendanceDisplayName } from "../isomorphic";

type RatingStatsUser = {
  nick?: string | null;
  name?: string | null;
  userImage?: { url?: string | null; [key: string]: unknown } | null;
  [key: string]: unknown;
};

type RatingStatsPlayer = {
  user?: RatingStatsUser | null;
  jobTitle?: string | null;
  nick?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

type RatingStatsMercenary = {
  user?: RatingStatsUser | null;
  nick?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

type RatingStatsCardAttendance = {
  id?: string;
  checkTime?: string | Date | null;
  player?: RatingStatsPlayer | null;
  mercenary?: RatingStatsMercenary | null;
  [key: string]: unknown;
};

export type RatingStatsCardData = {
  attendance: RatingStatsCardAttendance & AttendanceNameSource;
  averageRating?: number | null;
  voterCount?: number | null;
  likeCount?: number | null;
  [key: string]: unknown;
};

export function RatingStatsListItem({
  stats,
  rank,
  matchStartDate,
}: {
  stats: RatingStatsCardData;
  rank: number;
  matchStartDate: Date;
}) {
  const isPerception = stats.attendance.checkTime
    ? new Date(matchStartDate) < new Date(stats.attendance.checkTime)
    : false;
  const hasRating = typeof stats.averageRating === "number";
  const averageRating = hasRating ? (stats.averageRating ?? 0) : 0;
  const averageText = hasRating ? (averageRating / 20).toFixed(2) : "-";
  const voterText = typeof stats.voterCount === "number" ? String(stats.voterCount) : "-";
  const likeText = typeof stats.likeCount === "number" ? String(stats.likeCount) : "-";
  return (
    <div
      className={cn(
        "flex justify-between gap-2 text-sm rounded-3xl px-2 py-1 hover:bg-primary/10 transform",
      )}
    >
      <div className="flex gap-2">
        <div className="flex justify-center items-center min-w-4">{rank}</div>
        <Avatar
          className={cn("shadow-md", {
            "border-yellow-300 border": rank === 1,
            "border-gray-300 border": rank === 2,
            "border-orange-300 border": rank === 3,
          })}
        >
          <AvatarImage
            src={stats.attendance?.player?.user?.userImage?.url ?? undefined}
          ></AvatarImage>
          <AvatarFallback className="bg-white">
            <FaUser className="text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start justify-center">
          <p className="font-semibold text-sm drop-shadow-sm">
            {getAttendanceDisplayName(stats?.attendance)}
          </p>
          <div className="text-sm drop-shadow-sm gap-1 flex">
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
            score={averageRating}
            width={20}
            isHighLight={hasRating}
          />
          <span className="text-xs ">{averageText}</span>
          <span className="text-xs max-sm:hidden sm:block">{voterText} voters</span>
        </div>
        <div className="flex items-end gap-2 text-xs text-muted-foreground">
          <FiHeart className="text-pink-500" />
          <span className="text-foreground">{likeText}</span>
        </div>
      </div>
    </div>
  );
}

export const RatingStatsCard = ({
  stats,
  rank,
}: {
  stats?: RatingStatsCardData;
  rank?: 1 | 2 | 3;
}) => {
  const name = getAttendanceDisplayName(stats?.attendance);
  const hasRating = typeof stats?.averageRating === "number";
  const averageRating = hasRating ? (stats?.averageRating ?? 0) : 0;
  const averageText = hasRating ? (averageRating / 20).toFixed(2) : "-";
  const averageWithScale = hasRating ? `${averageText} / 3` : "평가 없음";
  const rankLabel = rank ? { 1: "MOM", 2: "2ND", 3: "3RD" }[rank] : "";
  return (
    <>
      <div
        className={cn("overflow-hidden rounded-lg  p-[0.01rem] w-full h-full", {
          "animate-border bg-gradient-to-r from-white via-amber-400 to-white bg-[length:400%_400%] p-[0.05rem]":
            rank === 1,
          "border border-gray-400": rank === 2,
          "border border-gray-800": rank === 3,
        })}
      >
        <div className={cn("group h-full overflow-hidden rounded-lg bg-zinc-800 px-4 py-4")}>
          <div className="relative h-full w-full">
            <div className="absolute -top-4 h-full w-full -translate-x-1/3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-800 via-zinc-800 to-zinc-800 group-hover:from-amber-700 group-hover:via-zinc-800 group-hover:to-zinc-800"></div>
            <div className="absolute left-0 top-0">
              <span className="flex items-center justify-start rounded-md bg-white bg-opacity-10 px-2 text-gray-200 opacity-90">
                <i
                  className={cn("fa-solid fa-trophy text-sm", {
                    "text-amber-400 group-hover:text-amber-200": rank === 1,
                    "text-gray-400": rank === 2,
                    "text-amber-800": rank === 3,
                  })}
                ></i>
                <span className="ml-1">{rankLabel}</span>
              </span>
            </div>

            <div className="absolute left-0 top-12 z-10">
              <span className="transform rounded-md px-2 text-2xl text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white group-hover:text-gray-200">
                {name}
              </span>
            </div>
            <div className="absolute left-2/3 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative h-[20rem] w-[20rem] transform overflow-hidden rounded-full opacity-50 shadow-lg shadow-white drop-shadow-md  duration-1000 group-hover:opacity-90">
                <img
                  alt={name ?? "선수"}
                  src={
                    stats?.attendance.player?.user?.userImage?.url ||
                    stats?.attendance.mercenary?.user?.userImage?.url ||
                    "/images/user_empty.png"
                  }
                  className="user-select-none user-drag-none pointer-events-none w-full rounded-md"
                />
              </div>
            </div>
            <div className="absolute top-0 right-0">
              {/* {onMoveClick && (
                <button onClick={(e) => onMoveClick(e)}>
                  <span className="flex items-center justify-start rounded-md bg-white bg-opacity-10 px-2 text-sm text-gray-200 opacity-90 hover:bg-opacity-20">
                    <i className={clsx("fa-solid fa-angles-right")}></i>
                    <span className="ml-1">이동하기</span>
                  </span>
                </button>
              )} */}
            </div>
            <div className="absolute left-0 bottom-5 flex space-x-3">
              <div>
                <div className="px-2 text-gray-300 group-hover:text-gray-100 max-md:text-xs md:text-sm">
                  평점
                </div>
                <div className="flex items-start justify-start px-2 text-gray-300 group-hover:text-gray-100 max-md:text-sm md:text-lg">
                  <StarRating
                    id={`result-mom-${stats?.attendance.id}`}
                    score={averageRating}
                    className="text-amber-400"
                  ></StarRating>
                  <span className="ml-2 text-sm">{averageWithScale}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export function _RatingStatsCard({
  stats,
  rank,
}: {
  stats?: RatingStatsCardData;
  rank?: 1 | 2 | 3;
}) {
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
  const hasRating = typeof stats.averageRating === "number";
  const averageRating = hasRating ? (stats.averageRating ?? 0) : 0;
  const averageText = hasRating ? (averageRating / 20).toFixed(2) : "-";
  const voterText =
    typeof stats.voterCount === "number" ? `${stats.voterCount} voters` : "투표 없음";
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
          <AvatarImage
            src={stats?.attendance?.player?.user?.userImage?.url ?? undefined}
          ></AvatarImage>
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
          score={averageRating}
          width={20}
          isHighLight={hasRating}
        />
        <span className="text-xs ">{averageText}</span>
      </div>
      <div className="flex items-end">
        <p className="text-xs italic text-gray-600">{voterText}</p>
      </div>
    </div>
  );
}
