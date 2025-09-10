import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext, useParams } from "@remix-run/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { RatingCard } from "~/features/matches";
import { rating as matches } from "~/features/matches/index.server";
import { RightDrawer as RatingRightDrawer } from "~/features/matches/ui/rating/RightDrawer";
import {
  isAttackPosition,
  isDefensePosition,
  isMiddlePosition,
  type POSITION_TYPE,
} from "~/libs/const/position.const";
import type { loader as layoutLoader } from "../../../_layout";

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const data = await matches.service.getRatingPageData(matchClubId);
  return data;
};

interface IRatingPageProps {}

const RatingPage = (_props: IRatingPageProps) => {
  const user = useSession();
  const params = useParams();
  const outletData = useOutletContext<Awaited<ReturnType<typeof layoutLoader>>>();

  const loaderData = useLoaderData<typeof loader>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { data } = useQuery<Awaited<ReturnType<typeof loader>>>({
    queryKey: ["MATCH_RATING_QUERY", params.matchClubId],
    queryFn: async () => {
      return await fetch(`/api/attendances/rating?matchClubId=${params.matchClubId}`).then((res) =>
        res.json(),
      );
    },
    initialData: loaderData,
  });
  const attendances = data.attendances;
  const match = outletData.match;
  const quarters = loaderData.matchClub?.quarters.sort((a, b) => a.order - b.order);
  const queryClient = useQueryClient();

  // update score
  const updateEvaluation = useMutation({
    mutationFn: async ({ attendanceId, score }: { attendanceId: string; score: number }) => {
      const res = await fetch("/api/evaluations/score", {
        method: "POST",
        body: JSON.stringify({
          matchClubId: params.matchClubId,
          attendanceId,
          score,
        }),
      });
      if (!res.ok) throw new Error("Failed to update score");
    },

    onMutate: async ({ attendanceId, score }) => {
      await queryClient.cancelQueries({
        queryKey: ["MATCH_RATING_QUERY", params.matchClubId],
      });

      const prevData = queryClient.getQueryData<Awaited<ReturnType<typeof loader>>>([
        "MATCH_RATING_QUERY",
        params.matchClubId,
      ]);

      if (prevData) {
        queryClient.setQueryData(["MATCH_RATING_QUERY", params.matchClubId], {
          ...prevData,
          attendances: prevData.attendances.map((att) =>
            att.id === attendanceId
              ? {
                  ...att,
                  evaluations: att.evaluations.map((ev) =>
                    ev.userId === user?.id ? { ...ev, score } : ev,
                  ),
                }
              : att,
          ),
        });
      }

      return { prevData };
    },

    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["MATCH_RATING_QUERY", params.matchClubId], context.prevData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["MATCH_RATING_QUERY", params.matchClubId],
      });
    },
  });

  // update like
  const toggleLike = useMutation({
    mutationFn: async ({ attendanceId, liked }: { attendanceId: string; liked: boolean }) => {
      await fetch("/api/evaluations/like", {
        method: "POST",
        body: JSON.stringify({
          matchClubId: params.matchClubId,
          attendanceId,
          liked,
        }),
      });
    },
    onMutate: async ({ attendanceId, liked }) => {
      await queryClient.cancelQueries({
        queryKey: ["MATCH_RATING_QUERY", params.matchClubId],
      });

      const prevData = queryClient.getQueryData<Awaited<ReturnType<typeof loader>>>([
        "MATCH_RATING_QUERY",
        params.matchClubId,
      ]);

      if (prevData) {
        queryClient.setQueryData(["MATCH_RATING_QUERY", params.matchClubId], {
          ...prevData,
          attendances: prevData.attendances.map((att) =>
            att.id === attendanceId
              ? {
                  ...att,
                  evaluations: att.evaluations.map((ev) =>
                    ev.userId === user?.id ? { ...ev, liked } : ev,
                  ),
                }
              : att,
          ),
        });
      }

      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["MATCH_RATING_QUERY", params.matchClubId], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["MATCH_RATING_QUERY", params.matchClubId],
      });
    },
  });
  if (!isMounted) return null;

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
                    hasGoal={attendance.assigneds.some((a) => a.goals.length > 0)}
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
                      }
                    }
                    onScoreChange={(score: number) =>
                      updateEvaluation.mutate({ attendanceId: attendance.id, score })
                    }
                    score={evaluation?.score || 0}
                    StarRating={StarRating}
                    liked={!!evaluation?.liked}
                    onToggleLike={() =>
                      toggleLike.mutate({ attendanceId: attendance.id, liked: !evaluation?.liked })
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
