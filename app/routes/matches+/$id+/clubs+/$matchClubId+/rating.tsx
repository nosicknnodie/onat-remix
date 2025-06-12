import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import dayjs from "dayjs";
import { useState } from "react";
import { FaRegThumbsUp } from "react-icons/fa";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Loading } from "~/components/Loading";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  isAttackPosition,
  isDefensePosition,
  isMiddlePosition,
} from "~/libs/const/position.const";
import { prisma } from "~/libs/db/db.server";
import { cn } from "~/libs/utils";
import { loader as layoutLoader } from "../../_layout";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const matchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
    include: {
      quarters: { include: { team1: true, team2: true } },
    },
  });
  const attendances = await prisma.attendance.findMany({
    where: {
      matchClubId: matchClubId,
      isVote: true,
    },
    include: {
      assigneds: { include: { goals: { where: { isOwnGoal: false } } } },
      player: {
        // where: { status: "APPROVED" },
        include: { user: { include: { userImage: true } } },
      },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return { attendances, matchClub };
};

interface IRatingPageProps {}

const RatingPage = (_props: IRatingPageProps) => {
  const outletData =
    useOutletContext<Awaited<ReturnType<typeof layoutLoader>>>();
  const loaderData = useLoaderData<typeof loader>();
  const [activeIndex, setActiveIndex] = useState(0);
  const attendances = loaderData.attendances;
  const match = outletData.match;
  const quarters = loaderData.matchClub?.quarters.sort(
    (a, b) => a.order - b.order
  );
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
            loop={true}
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
            grabCursor={true}
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
                : true;
              return (
                <SwiperSlide
                  className="w-72 h-full relative flex items-center py-4"
                  key={attendance.id}
                >
                  <Card
                    className={cn(
                      "w-full h-full transition-all duration-300 bg-zinc-100 rounded-xl flex flex-col",
                      {
                        "bg-white shadow-lg ring-1 ring-blue-400 z-10":
                          isActived,
                        "bg-zinc-100 opacity-90": !isActived,
                      }
                    )}
                  >
                    <CardHeader className="flex-shrink-0">
                      <CardTitle>{name} 님의 정보 카드</CardTitle>
                      <div className="flex gap-x-2">
                        <Badge variant={isPlayer ? "default" : "outline"}>
                          {isPlayer ? "회원" : "용병"}
                        </Badge>
                        {attendance.assigneds.some(
                          (a) => a.goals.length > 0
                        ) && <Badge variant="secondary">득점</Badge>}
                        {isPerception && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant={"destructive"}>지각</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                출석 체크 시간:{" "}
                                {attendance.checkTime
                                  ? dayjs(attendance.checkTime).format(
                                      "MM.DD (ddd) HH:mm"
                                    )
                                  : "-"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {attendance.state !== "NORMAL" && (
                          <Badge variant={"destructive"}>
                            {attendance.state === "EXCUSED"
                              ? "불참"
                              : "리타이어"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-y-2 justify-between">
                      <div>
                        <div className="flex justify-center items-center flex-col">
                          <Avatar className="md:size-24 max-md:size-16">
                            <AvatarImage src={imageUrl} />
                            <AvatarFallback>
                              <Loading />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-lg font-semibold">{name}</span>
                        </div>
                        <div className="text-sm font-semibold">경기횟수</div>
                        <div className="flex gap-1 w-full items-center">
                          <span className="rounded flex-1 text-xs text-center">
                            ({attendance.assigneds.length}/{quarters?.length})
                          </span>
                          {quarters?.map((quarter) => {
                            const position = attendance.assigneds.find(
                              (assigned) => assigned.quarterId === quarter.id
                            )?.position;
                            return (
                              <span
                                key={quarter.id}
                                className={cn("h-2 rounded flex-1 border ", {
                                  "bg-red-500":
                                    position && isAttackPosition(position),
                                  "bg-yellow-400":
                                    position && isMiddlePosition(position),
                                  "bg-blue-500":
                                    position && isDefensePosition(position),
                                  "bg-green-500": position && position === "GK",
                                  "bg-gray-200": !position,
                                })}
                              ></span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <StarRating
                          id={`${attendance.id}-star-id`}
                          score={60}
                          width={30}
                          isHighLight
                          onClick={(e, score) => {
                            console.log("score - ", score);
                          }}
                        />
                        <div>
                          <FaRegThumbsUp size={30} className="text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
