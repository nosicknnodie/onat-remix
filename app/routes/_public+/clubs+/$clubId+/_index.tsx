import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { FaChartLine, FaFutbol, FaInfo, FaRegThumbsUp, FaStar } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import { LoadingSwitch } from "~/components/LoadingSwitch";
import StarRating from "~/components/StarRating";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/Link";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ClubPermissionGate } from "~/features/clubs/client";
import {
  type ClubYearStatItem,
  useClubDetailsQuery,
  useClubYearStats,
  useWeeklyTopRating,
  type WeeklyTopRatingItem,
} from "~/features/clubs/isomorphic";
import { RatingStatsCard } from "~/features/matches/client";
import { cn } from "~/libs";

interface IClubPageProps {}

type RankTab = "rating" | "like" | "goal" | "ratingSum";

const rankTabConfig: Record<
  RankTab,
  { label: ReactNode; getScore: (item: ClubYearStatItem) => number }
> = {
  rating: {
    label: (
      <span className="flex items-center justify-center gap-1">
        <FaStar className="text-amber-500" />
        <span>평점</span>
      </span>
    ),
    getScore: (item) => item.averageRating,
  },
  like: {
    label: (
      <span className="flex items-center justify-center gap-1">
        <FaRegThumbsUp className="text-blue-600" />
        <span>좋아요</span>
      </span>
    ),
    getScore: (item) => item.totalLike,
  },
  goal: {
    label: (
      <span className="flex items-center justify-center gap-1">
        <FaFutbol className="text-green-600" />
        <span>골득점</span>
      </span>
    ),
    getScore: (item) => item.totalGoal,
  },
  ratingSum: {
    label: (
      <span className="flex items-center justify-center gap-1">
        <FaChartLine className="text-sky-600" />
        <span>평점합</span>
      </span>
    ),
    getScore: (item) => item.totalRating,
  },
};

const ClubHeroSkeleton = () => (
  <AspectRatio ratio={21 / 9} className="rounded-lg overflow-hidden shadow relative">
    <Skeleton className="h-full w-full" />
    <div className="p-2 flex items-center gap-2 absolute bottom-[5%] right-[5%]">
      <div className="flex flex-col gap-1 items-center">
        <Skeleton className="h-10 w-36" />
        <div className="text-xs font-semibold flex gap-1">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  </AspectRatio>
);

const statsSkeletonKeys = ["1", "2", "3", "4", "5", "6"];

const StatsSkeleton = () => (
  <div className="w-full space-y-3 p-2">
    <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
      <Skeleton className="h-5 w-40 sm:w-48" />
    </div>
    <div className="grid grid-cols-4 gap-2 sm:flex sm:justify-between border border-border/60 rounded-xl p-2">
      {["rating", "like", "goal", "ratingSum"].map((key) => (
        <Skeleton key={key} className="h-8 w-full rounded-xl" />
      ))}
    </div>
    <div className="w-full rounded-lg px-2 sm:px-4 space-y-2">
      {statsSkeletonKeys.map((key) => (
        <div key={key} className="flex justify-between gap-2 text-sm rounded-3xl px-2 py-2 ">
          <div className="flex gap-2 items-center">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="text-sm flex items-center gap-3 flex-1 w-full">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RightComponent = () => {
  const { clubId } = useParams();
  return (
    <>
      <ClubPermissionGate permission="CLUB_MANAGE">
        <Button asChild variant="secondary" className="h-6 gap-1">
          <Link to={`/clubs/${clubId}/edit`}>
            <FiEdit2 className="size-3.5" />
            클럽 수정
          </Link>
        </Button>
      </ClubPermissionGate>
    </>
  );
};

export const handle = { breadcrumb: "정보", right: RightComponent };

const ClubPage = (_props: IClubPageProps) => {
  const { clubId } = useParams();
  if (!clubId) {
    throw new Error("clubId is missing from route params");
  }

  const [heroLoaded, setHeroLoaded] = useState(false);
  const [rankTab, setRankTab] = useState<RankTab>("rating");
  const { data: club, isLoading: isClubLoading } = useClubDetailsQuery(clubId);
  const { data: stats, isLoading: isStatsLoading } = useClubYearStats(
    clubId,
    new Date().getFullYear(),
  );
  const { data: weeklyTopStats } = useWeeklyTopRating(clubId);
  const weeklyCards = useMemo(() => {
    if (!weeklyTopStats || weeklyTopStats.length === 0) return [];
    return weeklyTopStats.map((stat: WeeklyTopRatingItem) => ({
      ...stat,
      stats: {
        attendance: {
          player: {
            id: stat.playerId,
            nick: stat.nick ?? undefined,
            user: {
              nick: stat.nick ?? undefined,
              name: stat.nick ?? undefined,
              userImage: { url: stat.userImageUrl ?? undefined },
            },
          },
        },
        averageRating: stat.averageRating ?? 0,
      },
    }));
  }, [weeklyTopStats]);
  const heroImageUrl = club?.image?.url || "/images/club-default-image.webp";

  useEffect(() => {
    if (!heroImageUrl) return;
    setHeroLoaded(false);
  }, [heroImageUrl]);

  const displayedStats = useMemo(() => {
    if (!stats) return [];
    const sorted = [...stats].sort(
      (a, b) => rankTabConfig[rankTab].getScore(b) - rankTabConfig[rankTab].getScore(a),
    );
    return sorted.slice(0, 11);
  }, [rankTab, stats]);

  const renderMetric = (item: ClubYearStatItem) => {
    switch (rankTab) {
      case "rating":
        return (
          <>
            <StarRating id={item.playerId} score={item.averageRating} />
            <div className="whitespace-nowrap">
              <span className="font-semibold">{(item.averageRating / 20).toFixed(2)}</span>
              /5.0
            </div>
          </>
        );
      case "like":
        return (
          <div className="whitespace-nowrap flex items-center gap-2">
            <span className="font-semibold">{item.totalLike}</span>
            <FaRegThumbsUp className="text-primary" />
          </div>
        );
      case "goal":
        return (
          <div className="whitespace-nowrap">
            <span className="font-semibold">{item.totalGoal}</span> 골
          </div>
        );
      case "ratingSum":
        return (
          <div className="whitespace-nowrap">
            <span className="font-semibold">{(item.totalRating / 20).toFixed(2)}</span>점
          </div>
        );
      default:
        return null;
    }
  };

  if (!club && !isClubLoading) {
    return null;
  }
  const heroSection = club ? (
    <AspectRatio ratio={21 / 9} className="rounded-lg overflow-hidden shadow relative">
      <img
        src={heroImageUrl}
        alt="대표 이미지"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          heroLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => setHeroLoaded(true)}
        onError={() => setHeroLoaded(true)}
      />
      <div className="p-2 flex items-center gap-2 absolute bottom-[5%] right-[5%]">
        <div className="flex flex-col gap-1 items-center">
          <div className="sm:text-2xl max-sm:text-base font-semibold backdrop-blur-sm  bg-white/5 border border-white/10 p-2 rounded-lg text-white text-center flex gap-2 items-center">
            <Avatar className="sm:size-6 max-sm:size-4">
              <AvatarImage src={club?.emblem?.url || "/images/club-default-emblem.webp"} />
              <AvatarFallback className="bg-primary">
                <Loading />
              </AvatarFallback>
            </Avatar>
            {club.name}
          </div>
          <div className="text-xs font-semibold flex gap-1">
            <Badge className="bg-primary/40">{club.si || "-"}</Badge>
            <Badge className="bg-primary/40">{club.gun || "-"}</Badge>
          </div>
        </div>
      </div>
    </AspectRatio>
  ) : null;

  return (
    <>
      <LoadingSwitch isLoading={isClubLoading} skeleton={<ClubHeroSkeleton />}>
        {heroSection}
      </LoadingSwitch>
      <div className="grid w-full @xl:grid-cols-2 gap-2">
        <LoadingSwitch
          isLoading={isStatsLoading}
          skeleton={<StatsSkeleton />}
          className="w-full flex flex-col gap-2 relative"
        >
          {/** 탭 (평점, 좋아요, 골)*/}
          <div className="flex items-center justify-center gap-2">
            <p className="font-semibold drop-shadow-md text-center">
              Top of the Season {new Date().getFullYear()}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="출석률 안내"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FaInfo className="size-3 text-primary" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                className="w-max px-3 py-2 text-xs border-none bg-primary text-white font-semibold"
              >
                출석률 25% 이상인 선수만 집계합니다.
              </PopoverContent>
            </Popover>
          </div>
          <Tabs value={rankTab} onValueChange={(value) => setRankTab(value as RankTab)}>
            <TabsList className="mt-2 bg-transparent border-primary border w-full justify-around rounded-xl">
              {Object.entries(rankTabConfig).map(([value, { label }]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="w-full data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl hover:bg-primary/10"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="w-full rounded-lg px-2 flex flex-col gap-1">
            {displayedStats.map((item, index) => (
              <div
                key={item.playerId}
                className="flex justify-between gap-2 text-sm rounded-3xl px-2 py-1 hover:bg-primary/10 transform bg-gray-50 shadow-sm"
              >
                <div className="flex gap-2 items-center">
                  <Avatar>
                    <AvatarImage src={item.userImageUrl || "/images/user_empty.png"}></AvatarImage>
                    <AvatarFallback className="bg-white">
                      <Loading />
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-semibold">
                    {index + 1}.{item.nick}
                  </div>
                </div>
                <div className="flex gap-2 justify-start items-center">{renderMetric(item)}</div>
                <div className="text-sm flex items-center gap-3">
                  <div className="whitespace-nowrap">
                    <span className="font-semibold">{item.matchCount}</span>매치
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LoadingSwitch>
        {weeklyCards.length > 0 && (
          <div className="w-full flex flex-col gap-2 relative">
            <p className="font-semibold drop-shadow-md text-center">Week’s Star Players</p>
            <div className="grid w-full gap-2">
              {weeklyCards.map((weeklyCard, index) => (
                <Fragment key={weeklyCard.playerId ?? index}>
                  <div className="font-semibold text-sm flex flex-col p-2">
                    <p className="text-end pr-2">
                      {dayjs(weeklyCard.matchDate).format("YYYY-MM-DD (ddd)")}
                    </p>
                    <div className="h-72 w-full">
                      <RatingStatsCard stats={weeklyCard.stats} rank={1} />
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClubPage;
