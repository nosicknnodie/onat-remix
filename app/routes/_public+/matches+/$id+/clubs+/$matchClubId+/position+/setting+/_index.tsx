import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useRevalidator, useSearchParams } from "@remix-run/react";
import { useAtom } from "jotai/react";
import { atomWithStorage } from "jotai/utils";
import _ from "lodash";
import { useEffect, useState, useTransition } from "react";
import { Preview } from "react-dnd-preview";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DraggableChip, DropSpot, PositionToolbar, QuarterStepper } from "~/features/matches";
import { position as matches } from "~/features/matches/index.server";
import {
  isDiffPosition,
  isRLDiffPostion,
  PORMATION_POSITION_CLASSNAME,
  PORMATION_POSITIONS,
  type PORMATION_TYPE,
  POSITION_TEMPLATE_LIST,
  type POSITION_TYPE,
} from "~/libs/const/position.const";
import { typedEntries } from "~/libs/convert";
import { getUser } from "~/libs/db/lucia.server";
import { cn } from "~/libs/utils";
import {
  PositionSettingContext,
  useOptimisticPositionUpdate,
  usePositionSettingQuery,
} from "./_context";
import { PositionSettingDrawer } from "./_Drawer";
// const isTouchDevice = () => {
//   return typeof window !== "undefined" ? "ontouchstart" in window : false;
// };

// const bandendForDND = isTouchDevice() ? TouchBackend : HTML5Backend;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchClubId = params.matchClubId!;
  const data = await matches.service.getPositionSettingData(matchClubId);
  if (!data) return redirect("../");
  return data;
};

const POSITION_TEMPLATE = atomWithStorage<PORMATION_TYPE>("POSITION_TEMPLATE", "4-3-3");

interface IPositionSettingPageProps {}

const PositionSettingPage = (_props: IPositionSettingPageProps) => {
  const [positionTemplate, setPositionTemplate] = useAtom(POSITION_TEMPLATE);
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const matchClub = loaderData.matchClub;
  const { revalidate } = useRevalidator();
  const { mutateAsync } = useOptimisticPositionUpdate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPositionType, setSelectedPositionType] = useState<POSITION_TYPE>("GK");
  const [currentQuarterOrder, setCurrentQuarterOrder] = useState(
    Number(searchParams.get("quarter")) || 1,
  );
  const currentQuarter =
    matchClub.quarters.find((quarter) => quarter.order === currentQuarterOrder) || null;
  const [currentTeamId, setCurrentTeamId] = useState(
    searchParams.get("teamId") || matchClub.teams.at(0)?.id || null,
  );
  const [isLoading, startTransition] = useTransition();

  const query = usePositionSettingQuery();
  const attendancesData = query.data;

  /**
   * 쿼터가 최대 쿼터보다 많으면 증가시킴
   * @param quarter
   */
  const handleSetQuarter = (order: number) => {
    startTransition(async () => {
      const quarterId = matchClub.quarters.find((quarter) => quarter.order === order)?.id;
      if (!quarterId) {
        const maxOrder = matchClub.quarters.reduce((max, q) => {
          return q.order > max ? q.order : max;
        }, 0);
        await fetch("/api/quarters/new", {
          method: "POST",
          body: JSON.stringify({
            matchClubId: matchClub.id,
            order: maxOrder + 1,
          }),
        });
        revalidate();
      }
      setCurrentQuarterOrder(order);
    });
  };
  const maxPlayers = 11;
  // 배정인원 list
  const assigneds = attendancesData?.attendances
    .flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      })),
    )
    .filter(
      (assigned) =>
        assigned.quarterId === currentQuarter?.id &&
        (currentTeamId === null || assigned.teamId === currentTeamId),
    );

  const positions = typedEntries(PORMATION_POSITION_CLASSNAME).map(([position, { className }]) => {
    const assigned = assigneds?.find((assigned) => assigned.position === position) || null;
    let isFormation = PORMATION_POSITIONS[positionTemplate].includes(position);
    // 인원이 11명이 다 차면 isFormation를 false로
    isFormation = (assigneds?.length || 0) >= maxPlayers ? false : isFormation;
    // 배정이 있으면 isFormation를 false로
    isFormation = assigned?.attendance ? false : isFormation;

    return {
      key: position,
      className,
      assigned,
      isFormation,
    };
  });

  const handlePositionClick = (position: POSITION_TYPE) => () => {
    setSelectedPositionType(position);
    setDrawerOpen(true);
  };

  const handlePositionChange =
    (position: POSITION_TYPE) =>
    <T extends NonNullable<typeof assigneds>[number] | null>(item: T) => {
      if (!item) return;
      startTransition(async () => {
        await mutateAsync({
          assignedId: item.id,
          toPosition: position,
          attendanceId: item.attendance.id,
        });
      });
    };

  /**
   * 자동 배정
   */
  const handleAutoFormation = () => {
    /**
     * [LOGIC]
     * 1. validation
     *  - 포메이션에 남는자리 있는지 확인
     *  - 인원이 되는지 확인
     *  - 팀이 있을경우 동일 팀만
     *
     * 2. 자동배정 우선순위 (골키퍼를 제외한)
     *  - 1. 많이 못뛴인원
     *  - 2. 출석이 빠른인원
     *  - 3. 용병보다 회원 우선
     */

    // 포메이션이 남는자리 있는지 확인.
    const len = assigneds?.length || 0;
    if (len >= maxPlayers) return;
    const needed = maxPlayers - len;
    const emptyPositions = PORMATION_POSITIONS[positionTemplate].filter((position) => {
      return !assigneds?.find((assigned) => assigned.position === position);
    });

    // 동일팀에 이번쿼터에 없는 인원
    const notAttendance = attendancesData?.attendances
      .filter(
        (attendance) =>
          attendance.state === "NORMAL" &&
          !attendance.assigneds.some((assigned) => assigned.quarterId === currentQuarter?.id) &&
          (currentTeamId === null || attendance.teamId === currentTeamId),
        // assigned.quarterId !== currentQuarter?.id && assigned.attendance.teamId === currentTeamId,
      )
      .sort((a, b) => {
        // 1. 경기 적게 뛴 사람 우선
        const aGames = a.assigneds.filter((as) => as.position !== "GK").length;
        const bGames = b.assigneds.filter((as) => as.position !== "GK").length;
        if (aGames !== bGames) return aGames - bGames;

        // 2. 출석 시간 오래된 순 (즉, 더 먼저 체크한 사람 우선)
        const aTime = a.checkTime ? new Date(a.checkTime).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.checkTime ? new Date(b.checkTime).getTime() : Number.POSITIVE_INFINITY;
        if (aTime !== bTime) return aTime - bTime;

        // 3. 회원 우선, 용병은 뒤로
        const isAUser = !a.mercenaryId;
        const isBUser = !b.mercenaryId;
        return isAUser === isBUser ? 0 : isAUser ? -1 : 1;
      })
      .slice(0, needed);

    const mutableEmptyPositions = [...emptyPositions];
    /**
     *  각 인원별로 포지션 배정 (선호포지션이 맞으면 먼저 선호 포지션으로 넣어준다.)
     *  1. 선호포지션이 정확히 맞으면 선호포지션으로 넣어준다.
     *  2. 정확히 맞지않으면 선호포지션의 공,미,수 로 나누어서 맞는위치에 넣어준다.
     *  3. 여기서도 맞는게 없으면 좌 우로 구분해서 넣어준다.
     */
    const pushAttendances = notAttendance
      ?.map((attendance) => {
        const positions = attendance.player
          ? [
              attendance.player.user?.position1,
              attendance.player.user?.position2,
              attendance.player.user?.position3,
            ]
          : attendance.mercenary?.user
            ? [
                attendance.mercenary?.user.position1,
                attendance.mercenary?.user.position2,
                attendance.mercenary?.user.position3,
              ]
            : [
                attendance.mercenary?.position1,
                attendance.mercenary?.position2,
                attendance.mercenary?.position3,
              ];
        const compactPositions = _.compact(positions);
        const findedPosition = compactPositions.find((position) =>
          mutableEmptyPositions.includes(position),
        );
        // 선호포지션이 맞는 위치가 있을 경우
        if (findedPosition) {
          mutableEmptyPositions.splice(mutableEmptyPositions.indexOf(findedPosition), 1);
          return { ...attendance, toPosition: findedPosition };
        }

        // 선호포지션에 비슷한 포지션이 있을 경우. (공, 미, 수)
        const analogousPosition = compactPositions.find((position) =>
          mutableEmptyPositions.some((mep) => isDiffPosition(mep, position)),
        );
        if (analogousPosition) {
          const matchedEmptyPosition = mutableEmptyPositions.find((mep) =>
            isDiffPosition(mep, analogousPosition),
          );
          if (matchedEmptyPosition) {
            mutableEmptyPositions.splice(mutableEmptyPositions.indexOf(matchedEmptyPosition), 1);
            return { ...attendance, toPosition: matchedEmptyPosition };
          }
        }

        // 좌, 중, 우 구분으로 포지션을 넣어준다.
        const rlPosition = compactPositions.find((position) =>
          mutableEmptyPositions.some((mep) => isRLDiffPostion(mep, position)),
        );
        if (rlPosition) {
          const matchedEmptyPosition = mutableEmptyPositions.find((mep) =>
            isRLDiffPostion(mep, rlPosition),
          );
          if (matchedEmptyPosition) {
            mutableEmptyPositions.splice(mutableEmptyPositions.indexOf(matchedEmptyPosition), 1);
            return { ...attendance, toPosition: matchedEmptyPosition };
          }
        }
        // rest postion에서 첫번째 포지션으로 지정
        const lastToPosition = mutableEmptyPositions.at(0);
        mutableEmptyPositions.splice(0, 1);
        return { ...attendance, toPosition: lastToPosition };
      })
      .filter((attendance) => attendance.toPosition);
    startTransition(async () => {
      if (pushAttendances && pushAttendances.length > 0 && currentQuarter?.id) {
        await fetch("/api/assigneds", {
          method: "POST",
          body: JSON.stringify(
            pushAttendances.map((attendance) => ({
              attendanceId: attendance.id,
              quarterId: currentQuarter.id,
              position: attendance.toPosition,
              teamId: currentTeamId,
            })),
          ),
        });
        await query.refetch();
      }
    });
  };

  useEffect(() => {
    setCurrentQuarterOrder(Number(searchParams.get("quarter")));
    setCurrentTeamId(searchParams.get("teamId") || null);
    return () => {
      setCurrentTeamId(null);
      setCurrentQuarterOrder(1);
    };
  }, [searchParams]);

  return (
    <>
      <PositionSettingContext value={{ query, currentQuarter, currentTeamId, assigneds }}>
        <div className="space-y-4 flex flex-col gap-2">
          <PositionToolbar
            backTo={{ pathname: "../", search: `quarterOrder=${currentQuarter?.order}` }}
            left={
              currentTeamId ? (
                <Select value={currentTeamId} onValueChange={setCurrentTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchClub.teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null
            }
            right={
              <Select
                value={positionTemplate}
                onValueChange={(v: PORMATION_TYPE) => setPositionTemplate(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="포지션 템플릿 선택" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_TEMPLATE_LIST.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <QuarterStepper
            current={currentQuarterOrder}
            onPrev={() => setCurrentQuarterOrder((prev) => prev - 1)}
            onNext={() => handleSetQuarter(currentQuarterOrder + 1)}
            disablePrev={currentQuarterOrder === 1 || isLoading}
            disableNext={isLoading}
          />
          <section>
            <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative">
              <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/test-vertical.svg')] md:bg-[url('/images/test.svg')] bg-cover bg-center" />
              <div className="absolute top-0 right-0 z-20 p-2">
                <Button variant="outline" onClick={handleAutoFormation}>
                  자동배치
                </Button>
              </div>

              {typeof window !== "undefined" && "ontouchstart" in window && (
                <Preview
                  generator={({ ref, style, item }) => {
                    const assigned = item as {
                      attendance: {
                        player: {
                          user: { name: string };
                        };
                        mercenary: { user: { name: string }; name: string };
                      };
                    };
                    return (
                      <div
                        ref={ref as unknown as React.Ref<HTMLDivElement>}
                        // className={cn(customClassName)}
                        className="z-30 rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border border-primary bg-white overflow-hidden"
                        style={style}
                      >
                        {assigned.attendance.player?.user?.name ||
                          assigned.attendance.mercenary?.user?.name ||
                          assigned.attendance.mercenary?.name ||
                          ""}
                      </div>
                    );
                  }}
                />
              )}
              {positions.map((position) => {
                return (
                  <DropSpot
                    layoutId={position.assigned?.id}
                    key={[position.key, position.assigned?.id].join("-")}
                    canDrop={({ item }: { item: typeof position.assigned }) => {
                      return position.key !== item?.position;
                    }}
                    onDrop={handlePositionChange(position.key)}
                    className={cn(
                      "absolute z-20 md:-ml-8 md:-mt-8 max-md:-ml-6 max-md:-mt-6",
                      position.className,
                      {
                        invisible: !(position.assigned || position.isFormation),
                      },
                    )}
                  >
                    {position.assigned ? (
                      <>
                        <DraggableChip
                          item={position.assigned}
                          variant={"ghost"}
                          onClick={handlePositionClick(position.key)}
                          className={({ isDragging }) => {
                            return cn(
                              "rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border border-primary bg-white shadow-md",
                              {
                                // ["outline outline-primary"]: position.assigned,
                                "opacity-30": isDragging,
                              },
                            );
                          }}
                        >
                          {position.assigned
                            ? position.assigned.attendance.player?.user?.name ||
                              position.assigned.attendance.mercenary?.user?.name ||
                              position.assigned.attendance.mercenary?.name
                            : position.key}
                        </DraggableChip>
                      </>
                    ) : (
                      <Button
                        onClick={handlePositionClick(position.key)}
                        variant={"ghost"}
                        className={cn(
                          "rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs w-full h-full flex justify-center items-center bg-white shadow-md",
                        )}
                      >
                        {position.key}
                      </Button>
                    )}
                    {/* </PositionSettingDrawer> */}
                  </DropSpot>
                );
              })}

              <PositionSettingDrawer
                positionType={selectedPositionType}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
              ></PositionSettingDrawer>
            </div>
          </section>
        </div>
      </PositionSettingContext>
    </>
  );
};

export default PositionSettingPage;
