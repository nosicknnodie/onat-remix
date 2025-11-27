import { useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { type PropsWithChildren, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { FaInfo, FaPlus, FaRegThumbsUp, FaThumbsUp, FaUser } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useSession } from "~/contexts";
import { RatingStatsCard, RatingStatsListItem } from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  type RatingRegisterAttendance,
  useMatchClubQuery,
  useRatingLikeMutation,
  useRatingRegisterQuery,
  useRatingScoreMutation,
  useRatingSeedMutation,
  useRatingStatsQuery,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks/use-toast";
export const handle = {
  breadcrumb: () => {
    return <>평점</>;
  },
};
interface IRatingPageProps {}

const RatingPage = (_props: IRatingPageProps) => {
  const session = useSession();
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;
  const { data: matchClubQueryData, isLoading: isMatchClubLoading } = useMatchClubQuery(
    matchClubId,
    {
      clubId,
      enabled: Boolean(matchClubId),
    },
  );
  const match = matchClubQueryData?.matchClub?.match;
  const stDate = match?.stDate;

  const { data: ratingRegisterData, isLoading: isRatingRegisterLoading } = useRatingRegisterQuery(
    matchClubId,
    { enabled: Boolean(matchClubId) },
  );
  const { data: ratingStats, isLoading: isRatingStatsLoading } = useRatingStatsQuery(matchClubId);
  const normalizedStats = (ratingStats?.stats ?? []).map((stat) => ({
    ...stat,
    averageRating: Number(stat.averageRating ?? 0),
  }));
  const stats = (() => {
    const filtered = normalizedStats.sort((a, b) => b.averageRating - a.averageRating) ?? [];
    const voteCount =
      ratingRegisterData?.attendances?.filter((attendance) => attendance.isVote).length ?? 0;
    const limit = voteCount > 0 ? Math.ceil(voteCount / 2) : filtered.length;
    return filtered.slice(0, limit);
  })();
  const playerAttendances =
    ratingRegisterData?.attendances.filter(
      (attendance) =>
        attendance.player && attendance.isVote && attendance.player?.user?.id !== session?.id,
    ) ?? [];
  const canSubmitRating =
    ratingRegisterData?.attendances.some(
      (attendance) =>
        attendance.isVote &&
        (attendance.player?.user?.id === session?.id ||
          attendance.mercenary?.user?.id === session?.id),
    ) ?? false;
  const totalInputPoints =
    ratingRegisterData?.attendances.filter((attendance) => attendance.player && attendance.isVote)
      .length ?? 0;
  const now = dayjs();
  const ratingStart = stDate ? dayjs(stDate).add(1, "hour") : null;
  const ratingEnd = stDate ? dayjs(stDate).add(1, "day") : null;
  const isRatingWindowOpen =
    Boolean(ratingStart && ratingEnd) && now.isAfter(ratingStart) && now.isBefore(ratingEnd);

  const isLoading = isMatchClubLoading || isRatingStatsLoading || !match || !stDate;
  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex justify-end p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <FaInfo className="text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              sideOffset={8}
              className="w-max px-3 py-2 text-xs border-none bg-primary text-white font-semibold"
            >
              <p className="font-semibold">평점 기준 안내</p>
              <ul className="list-disc list-inside space-y-1">
                <li>평점을 하나라도 입력하면 본인 평점은 자동으로 만점 처리됩니다.</li>
                <li>본인 포함 최소 3명 이상이 점수을 입력해야 기록이 됩니다.</li>
                <li>평점이 0이면 기록이 무효 처리됩니다.</li>
                <li>
                  여기서 기록이란 통계에 합 및 평균처리에서 제외되는 것으로 기록 자체를 쓰지
                  않습니다.
                </li>
                <li>평점 입력은 경기시간시작 기준 하루동안 입력 할 수 있습니다.</li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 justify-center w-full">
            {stats?.length === 0 ? (
              <div className="text-sm flex justify-center flex-col items-center w-full">
                <p>평점 정보가 없습니다.</p>
                {isRatingWindowOpen ? (
                  <p>평점 입력 부탁드립니다.</p>
                ) : (
                  <p>평가 입력 시간이 지났습니다.</p>
                )}
              </div>
            ) : (
              <>
                <div className="gap-2 grid sm:grid-cols-3 max-sm:grid-cols-1 w-full">
                  <div className="h-72">
                    <RatingStatsCard stats={stats?.at(0)} rank={1} />
                  </div>
                  <div className="h-72">
                    <RatingStatsCard stats={stats?.at(1)} rank={2} />
                  </div>
                  <div className="h-72">
                    <RatingStatsCard stats={stats?.at(2)} rank={3} />
                  </div>
                </div>
              </>
            )}
          </div>
          {stats?.length !== 0 && (
            <div className="flex flex-col gap-2">
              <p className="pl-4">
                <span className="font-semibold">M</span>an <span className="font-semibold">O</span>f
                the <span className="font-semibold">M</span>atch
              </p>
              <div className="">
                {stats?.map((stat, index) => (
                  <Fragment key={stat.attendanceId}>
                    <RatingStatsListItem
                      stats={stat}
                      rank={index + 1}
                      matchStartDate={new Date(match.stDate)}
                    />
                  </Fragment>
                ))}
              </div>
            </div>
          )}
          {isRatingWindowOpen && (
            <div className="fixed bottom-6 right-6 z-20">
              {canSubmitRating ? (
                <RatingRightInputDrawer
                  attendances={playerAttendances}
                  isLoading={isRatingRegisterLoading}
                  matchClubId={matchClubId}
                  userId={session?.id}
                  inputPointLimit={totalInputPoints}
                  stDate={stDate}
                >
                  <Button
                    type="button"
                    className="rounded-full h-14 w-14 bg-primary text-white hover:bg-primary/90 shadow-xl"
                    aria-label="평점 입력"
                  >
                    <FaPlus className="size-6" />
                  </Button>
                </RatingRightInputDrawer>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      className="rounded-full h-14 w-14 bg-muted text-muted-foreground"
                      aria-label="평점 입력 불가"
                      disabled
                    >
                      <FaPlus className="size-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent sideOffset={8} className="max-w-xs text-xs">
                    이 경기에 참여한 선수만 평점을 입력할 수 있습니다.
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const normalizeScore = (score: number) => {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
};

// 포인트는 기본점수 대비 증감분에 대해 계산한다. (1★=1p, 2★=3p, 3★=6p)
const deltaStarToCost = (deltaStar: number) => {
  const abs = Math.abs(deltaStar);
  if (abs <= 1) return abs * 1;
  if (abs <= 2) return 1 + (abs - 1) * 2;
  return 3 + (abs - 2) * 3;
};

const scoreToPointCost = (score: number, baseScore: number) => {
  const star = normalizeScore(score) / 20;
  const baseStar = normalizeScore(baseScore) / 20;
  const delta = star - baseStar;
  return deltaStarToCost(delta);
};

const maxDeltaStarForBudget = (budget: number) => {
  if (budget <= 0) return 0;
  if (budget <= 1) return budget;
  if (budget <= 3) return (budget + 1) / 2;
  if (budget <= 6) return (budget + 3) / 3;
  return 3;
};

const RatingRightInputDrawer = ({
  attendances,
  isLoading,
  matchClubId,
  userId,
  inputPointLimit,
  children,
  stDate,
}: {
  attendances: RatingRegisterAttendance[];
  isLoading?: boolean;
  matchClubId?: string;
  userId?: string;
  inputPointLimit: number;
  stDate: string | Date;
} & PropsWithChildren) => {
  const { toast } = useToast();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const scoreMutation = useRatingScoreMutation(matchClubId, { userId, target: "register" });
  const likeMutation = useRatingLikeMutation(matchClubId, { userId, target: "register" });
  const seedMutation = useRatingSeedMutation(matchClubId);
  const [open, setOpen] = useState(false);

  const getScoreValue = (attendance: RatingRegisterAttendance) =>
    scores[attendance.id] ?? attendance.myEvaluation?.score ?? 0;
  const getLikedValue = (attendance: RatingRegisterAttendance) =>
    liked[attendance.id] ?? attendance.myEvaluation?.liked ?? false;
  const getBaseScore = (attendance: RatingRegisterAttendance) =>
    attendance.player?.user?.id === userId ? 100 : 60;

  const maxLikes = 5;
  const usedLikes = attendances.reduce(
    (sum, attendance) => sum + (getLikedValue(attendance) ? 1 : 0),
    0,
  );
  const usedPoints = attendances.reduce(
    (sum, attendance) =>
      sum + scoreToPointCost(getScoreValue(attendance), getBaseScore(attendance)),
    0,
  );
  const remainingPoints = Math.max(0, inputPointLimit - usedPoints);

  const handleOpenChange = async (next: boolean) => {
    if (next && !seedMutation.isPending && matchClubId) {
      await seedMutation.mutateAsync();
    }
    setOpen(next);
  };

  const handleScoreChange = (attendance: RatingRegisterAttendance, score: number) => {
    const normalizedScore = normalizeScore(score);
    const previousScore = getScoreValue(attendance);
    const baseScore = getBaseScore(attendance);
    const previousCost = scoreToPointCost(previousScore, baseScore);
    const availableBudget = remainingPoints + previousCost;
    const targetStar = normalizedScore / 20;
    const baseStar = baseScore / 20;
    const deltaStar = targetStar - baseStar;
    const desiredCost = deltaStarToCost(deltaStar);
    const maxDelta = Math.min(Math.abs(deltaStar), maxDeltaStarForBudget(availableBudget));
    const clampedStar = baseStar + Math.sign(deltaStar) * maxDelta;
    const adjustedStar = Math.floor(clampedStar * 2) / 2; // 0.5 단위
    const adjustedScore = normalizeScore(adjustedStar * 20);
    if (desiredCost > availableBudget) {
      toast({
        variant: "destructive",
        description: "포인트가 부족해요. 여유 포인트를 확보한 뒤 다시 시도해주세요.",
      });
      return;
    }
    if (adjustedScore === previousScore) return;
    setScores((prev) => ({ ...prev, [attendance.id]: adjustedScore }));
    scoreMutation.mutate({ attendanceId: attendance.id, score: adjustedScore });
  };

  const handleToggleLike = (attendance: RatingRegisterAttendance) => {
    const prevLiked = getLikedValue(attendance);
    const nextLiked = !prevLiked;
    if (nextLiked && usedLikes >= maxLikes) {
      toast({
        variant: "destructive",
        description: "좋아요는 최대 5개까지 선택할 수 있어요.",
      });
      return;
    }
    setLiked((prev) => ({ ...prev, [attendance.id]: nextLiked }));
    likeMutation.mutate({ attendanceId: attendance.id, liked: nextLiked });
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
          <DrawerTitle>평점 입력</DrawerTitle>
          <p className="text-xs text-muted-foreground">
            사용 가능 포인트 {remainingPoints} / {inputPointLimit} · 좋아요 {maxLikes - usedLikes}/
            {maxLikes}
          </p>
          <Popover>
            <PopoverTrigger className="text-[10px] text-primary underline underline-offset-2">
              안내 보기
            </PopoverTrigger>
            <PopoverContent
              sideOffset={8}
              className="w-max px-3 py-2 text-xs border-none bg-primary text-white font-semibold"
            >
              <p>1. 평점 입력에 제한이 있습니다.</p>
              <p>2. 총 사용 포인트는 매치 참여자 수만큼 부여됩니다.</p>
              <p>3. 별은 가중치가 있습니다. 1★=1p, 2★=3p, 3★=6p (0.5★ 단위).</p>
              <p>4. 좋아요는 총 5개까지 가능합니다.</p>
            </PopoverContent>
          </Popover>
        </DrawerHeader>
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loading />
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              평점을 입력할 선수가 없습니다.
            </div>
          ) : (
            attendances.map((attendance) => {
              const score = getScoreValue(attendance);
              const isLiked = getLikedValue(attendance);
              const _isPerception =
                attendance.checkTime && new Date(attendance.checkTime) < new Date(stDate);
              const isGoal = attendance.records.some((record) => !record.isOwnGoal);
              return (
                <div
                  key={attendance.id}
                  className="flex items-center gap-2 hover:bg-primary/10 rounded-2xl px-1 py-2"
                >
                  <Avatar className="size-12">
                    <AvatarImage src={attendance.player?.user?.userImage?.url ?? undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <FaUser />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{getAttendanceDisplayName(attendance)}</p>
                    <div className="flex gap-1">
                      {isGoal && (
                        <Badge variant={"default"} className="h-4 truncate">
                          득점
                        </Badge>
                      )}
                      {/* {!attendance.isCheck && (
                        <Badge variant="destructive" className="h-4 truncate">
                          불참
                        </Badge>
                      )}
                      {isPerception && (
                        <Badge variant="destructive" className="h-4 truncate">
                          지각
                        </Badge>
                      )} */}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StarRating
                      id={`${attendance.id}-drawer-star`}
                      score={score}
                      width={24}
                      isHighLight
                      onClick={(_e, newScore) => handleScoreChange(attendance, newScore)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleLike(attendance)}
                      aria-label={`좋아요 ${isLiked ? "취소" : "선택"}`}
                    >
                      {isLiked ? (
                        <FaThumbsUp size={30} className="text-primary" />
                      ) : (
                        <FaRegThumbsUp size={30} className="text-muted" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RatingPage;
