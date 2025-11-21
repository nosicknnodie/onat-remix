import { useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { FaRegThumbsUp, FaThumbsUp } from "react-icons/fa";
import { RiExpandLeftLine } from "react-icons/ri";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Loading } from "~/components/Loading";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { TooltipProvider } from "~/components/ui/tooltip";
import { useSession } from "~/contexts";
import { RatingCard, RatingRightDrawer } from "~/features/matches/client";
import {
  useMatchClubQuery,
  useRatingLikeMutation,
  useRatingQuery,
  useRatingScoreMutation,
} from "~/features/matches/isomorphic";
import { useQueryErrorToast, useToast } from "~/hooks";
import { getToastForError } from "~/libs";
import {
  isAttackPosition,
  isDefensePosition,
  isMiddlePosition,
  type POSITION_TYPE,
} from "~/libs/const/position.const";

export const handle = {
  breadcrumb: () => {
    return <>평점</>;
  },
};
interface IRatingPageProps {}

const RatingPage = (_props: IRatingPageProps) => {
  const user = useSession();
  const params = useParams();
  const matchClubId = params.matchClubId;
  const clubId = params.clubId;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { toast } = useToast();
  const {
    data,
    isLoading: isRatingLoading,
    error: ratingError,
  } = useRatingQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  useQueryErrorToast(ratingError);
  const attendances = data?.attendances ?? [];
  const { data: matchClubData, isLoading: isMatchClubLoading } = useMatchClubQuery(matchClubId, {
    clubId,
    enabled: Boolean(matchClubId),
  });
  const matchClub = matchClubData?.matchClub ?? null;
  const match = matchClub?.match ?? null;
  const quarters = matchClub?.quarters
    ? [...matchClub.quarters].sort((a, b) => a.order - b.order)
    : null;
  const updateEvaluation = useRatingScoreMutation(matchClubId, user?.id);
  const toggleLike = useRatingLikeMutation(matchClubId, user?.id);
  if (!isMounted || isMatchClubLoading || isRatingLoading || !data || !match || !quarters) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <TooltipProvider>
          <div className="text-lg font-semibold text-center">점수 등록</div>
          <Swiper
            centeredSlides={true}
            onActiveIndexChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
            }}
            watchSlidesProgress={true}
            loop={true}
            slideToClickedSlide={true}
            loopAdditionalSlides={5}
            breakpoints={{
              0: {
                slidesPerView: 1.5, // 모바일
              },
              768: {
                slidesPerView: 3, // 태블릿 이상
              },
            }}
            modules={[EffectCoverflow]}
            effect="coverflow"
            // grabCursor={true}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: false,
            }}
            className="md:h-[26rem] max-md:h-[24rem] w-full p-8 relative"
          >
            {attendances.map((attendance, i) => {
              const name =
                attendance.player?.user?.name ||
                attendance.player?.nick ||
                attendance.mercenary?.user?.name ||
                attendance.mercenary?.name ||
                "";
              const imageUrl =
                attendance.player?.user?.userImage?.url ||
                attendance.mercenary?.user?.userImage?.url ||
                "/images/user_empty.png";
              const isPlayer = !!attendance.player;
              const isActived = activeIndex === i;
              // 지각여부
              const isPerception = attendance.checkTime
                ? new Date(match.stDate) < new Date(attendance.checkTime)
                : new Date(match.stDate) < new Date();
              const evaluation = attendance.evaluations.find(
                (evaluation) => evaluation.userId === user?.id,
              );
              return (
                <SwiperSlide
                  className="w-72 h-full relative flex items-center py-4"
                  key={`key-${attendance.id}-${i}`}
                >
                  <RatingCard
                    name={name}
                    imageUrl={imageUrl}
                    isPlayer={isPlayer}
                    isPerception={isPerception}
                    hasGoal={attendance.records.some((record) => !record.isOwnGoal)}
                    isActive={isActived}
                    quartersCount={quarters?.length ?? 0}
                    playedCount={attendance.assigneds.length}
                    quarters={quarters ?? []}
                    Avatar={Avatar}
                    AvatarImage={AvatarImage}
                    AvatarFallback={AvatarFallback}
                    Loading={Loading}
                    isAttackPosition={(p: string) => isAttackPosition(p as POSITION_TYPE)}
                    isMiddlePosition={(p: string) => isMiddlePosition(p as POSITION_TYPE)}
                    isDefensePosition={(p: string) => isDefensePosition(p as POSITION_TYPE)}
                    rightDrawerTrigger={
                      <RatingRightDrawer
                        attendance={attendance}
                        quarters={quarters ?? []}
                        matchStDate={match.stDate}
                      >
                        <Button size={"sm"} variant="ghost" className="text-gray-500">
                          Detail
                          <RiExpandLeftLine className="ml-2" />
                        </Button>
                      </RatingRightDrawer>
                    }
                    attendance={
                      attendance as unknown as {
                        id: string;
                        assigneds: { quarterId: string; position?: string; goals?: unknown[] }[];
                        records: { quarterId: string; isOwnGoal: boolean }[];
                      }
                    }
                    onScoreChange={(score: number) =>
                      updateEvaluation.mutate(
                        { attendanceId: attendance.id, score },
                        {
                          onError: (e) => toast(getToastForError(e)),
                        },
                      )
                    }
                    score={evaluation?.score || 0}
                    StarRating={StarRating}
                    liked={!!evaluation?.liked}
                    onToggleLike={() =>
                      toggleLike.mutate(
                        { attendanceId: attendance.id, liked: !evaluation?.liked },
                        {
                          onError: (e) => toast(getToastForError(e)),
                        },
                      )
                    }
                    LikeIcon={FaThumbsUp}
                    UnlikeIcon={FaRegThumbsUp}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </TooltipProvider>
      </div>
    </>
  );
};

export default RatingPage;
