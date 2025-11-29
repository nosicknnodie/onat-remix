import { useParams } from "@remix-run/react";
import { useAtom } from "jotai/react";
import { atomWithStorage } from "jotai/utils";
import _ from "lodash";
import { useEffect, useState, useTransition } from "react";
import { Preview } from "react-dnd-preview";
import { RxReset } from "react-icons/rx";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DraggableChip, DropSpot, PositionSettingDrawer } from "~/features/matches/client";
import {
  getAttendanceDisplayName,
  type PositionAttendance,
  useMatchClubQuery,
  useOptimisticPositionUpdate,
  usePositionAssignedDeleteAllMutation,
  usePositionAssignMutation,
  usePositionContext,
  usePositionQuery,
} from "~/features/matches/isomorphic";
import { cn, getContrastColor } from "~/libs/isomorphic";
import {
  isDiffPosition,
  isRLDiffPostion,
  PORMATION_POSITION_CLASSNAME,
  PORMATION_POSITIONS,
  type PORMATION_TYPE,
  POSITION_TEMPLATE_LIST,
  type POSITION_TYPE,
} from "~/libs/isomorphic/const/position.const";
import { typedEntries } from "~/libs/isomorphic/convert";

const BreadCrumbComponent = () => {
  const params = useParams();
  const matchClubId = params.matchClubId;
  const teamId = params.teamId;
  const matchClubQuery = useMatchClubQuery(matchClubId, { enabled: Boolean(matchClubId) });
  const teamName = teamId
    ? (matchClubQuery.data?.matchClub?.teams?.find((team) => team.id === teamId)?.name ?? null)
    : null;
  return <>{teamName ? `${teamName}` : "설정"}</>;
};

export const handle = {
  breadcrumb: () => {
    return (
      <>
        <BreadCrumbComponent />
      </>
    );
  },
};
// removed local context/drawer; using features UI
// const isTouchDevice = () => {
//   return typeof window !== "undefined" ? "ontouchstart" in window : false;
// };

// const bandendForDND = isTouchDevice() ? TouchBackend : HTML5Backend;

const POSITION_TEMPLATE = atomWithStorage<PORMATION_TYPE>("POSITION_TEMPLATE", "4-3-3");

interface IPositionSettingPageProps {}

const PositionSettingPage = (_props: IPositionSettingPageProps) => {
  const [positionTemplate, setPositionTemplate] = useAtom(POSITION_TEMPLATE);
  const params = useParams();
  const matchClubId = params.matchClubId!;
  const assignMutation = usePositionAssignMutation(matchClubId);
  const matchClubQuery = useMatchClubQuery(matchClubId, { enabled: Boolean(matchClubId) });
  const matchClub = matchClubQuery.data?.matchClub;
  const matchClubLoading = matchClubQuery.isLoading;
  const { mutateAsync } = useOptimisticPositionUpdate(matchClubId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPositionType, setSelectedPositionType] = useState<POSITION_TYPE>("GK");
  const [shouldShowDragPreview, setShouldShowDragPreview] = useState(false);
  const positionContext = usePositionContext();
  const resetPositionMutation = usePositionAssignedDeleteAllMutation(matchClubId);
  const currentQuarterOrder = positionContext?.currentQuarterOrder ?? 1;
  const currentQuarter =
    matchClub?.quarters.find((quarter) => quarter.order === currentQuarterOrder) || null;
  const currentQuarterSummary = currentQuarter
    ? { id: currentQuarter.id, order: currentQuarter.order }
    : null;
  const [, startTransition] = useTransition();

  const query = usePositionQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  const attendances = query.data?.attendances ?? [];
  const teamParamId = params.teamId ?? null;
  const handleSelectedAssigned = async (
    attendance: PositionAttendance,
    positionType: POSITION_TYPE,
  ) => {
    if (!currentQuarter?.id) return;
    try {
      setDrawerOpen(false);
      await assignMutation.mutateAsync({
        attendanceId: attendance.id,
        quarterId: currentQuarter.id,
        position: positionType,
        teamId: teamParamId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouchDevice = "ontouchstart" in window;
    const isSafari =
      typeof navigator !== "undefined" &&
      /safari/i.test(navigator.userAgent) &&
      !/chrome/i.test(navigator.userAgent);
    setShouldShowDragPreview(isTouchDevice || isSafari);
  }, []);

  const maxPlayers = 11;
  // 배정인원 list
  const resolvedTeamId =
    teamParamId ??
    positionContext?.currentTeamId ??
    matchClub?.teams?.[0]?.id ??
    currentQuarter?.team1Id ??
    null;
  const assigneds = attendances
    .flatMap((attendance) =>
      attendance.assigneds.map((assigned) => ({
        ...assigned,
        attendance,
      })),
    )
    .filter(
      (assigned) =>
        assigned.quarterId === currentQuarter?.id &&
        (resolvedTeamId === null || assigned.teamId === resolvedTeamId),
    );

  const positions = typedEntries(PORMATION_POSITION_CLASSNAME).map(([position, { className }]) => {
    const assigned = assigneds?.find((assigned) => assigned.position === position) || null;
    let isFormation = PORMATION_POSITIONS[positionTemplate].includes(position);
    // 인원이 11명이 다 차면 isFormation를 false로
    isFormation = (assigneds?.length || 0) >= maxPlayers ? false : isFormation;
    // 배정이 있으면 isFormation를 false로
    isFormation = assigned?.attendance ? false : isFormation;

    const teamId = assigned?.teamId || assigned?.attendance.teamId;
    const team = matchClub?.teams.find((team) => team.id === teamId);
    const teamColor = team?.color;
    const contrastColor = teamColor ? getContrastColor(teamColor) : undefined;

    return {
      key: position,
      className,
      assigned,
      isFormation,
      teamColor,
      contrastColor,
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

  const handleResetFormation = () => {
    startTransition(async () => {
      confirm({ title: "배정을 리셋하시겠어요?", confirmText: "리셋" }).onConfirm(async () => {
        try {
          await resetPositionMutation.mutateAsync({
            quarterId: currentQuarter?.id || "",
            teamId: teamParamId,
          });
        } catch (error) {
          console.error(error);
        }
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
    const notAttendance = attendances
      .filter(
        (attendance) =>
          attendance.state === "NORMAL" &&
          !attendance.assigneds.some((assigned) => assigned.quarterId === currentQuarter?.id) &&
          (resolvedTeamId === null || attendance.teamId === resolvedTeamId),
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
    const popNonGkPosition = () => {
      const nonGkIndex = mutableEmptyPositions.findIndex((pos) => pos !== "GK");
      if (nonGkIndex >= 0) {
        return mutableEmptyPositions.splice(nonGkIndex, 1)[0];
      }
      return mutableEmptyPositions.shift();
    };
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
        const lastToPosition = popNonGkPosition();
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
              teamId: resolvedTeamId,
            })),
          ),
        });
        await query.refetch();
      }
    });
  };

  if (matchClubLoading || !matchClub) {
    return (
      <div className="py-10 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 flex flex-col gap-2">
        <section>
          <div className="w-full overflow-hidden max-md:pb-[154.41%] md:pb-[64.76%] relative outline outline-2 outline-[#d4edda] rounded-lg">
            <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(0deg,#e8f5e9_0%,#e8f5e9_10%,#d4edda_10%,#d4edda_20%)] md:bg-[repeating-linear-gradient(90deg,#e8f5e9_0%,#e8f5e9_10%,#d4edda_10%,#d4edda_20%)]" />
            <div className="absolute top-0 left-0 w-full h-full z-10 max-md:bg-[url('/images/board-vertical.svg')] md:bg-[url('/images/board.svg')] bg-cover bg-center" />
            <div className="absolute top-0 right-0 z-20 p-2 flex justify-end items-center gap-2">
              <Select
                value={positionTemplate}
                onValueChange={(value) => setPositionTemplate(value as PORMATION_TYPE)}
              >
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue placeholder="포메이션" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_TEMPLATE_LIST.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleAutoFormation}>
                자동배치
              </Button>
              <Button variant="outline" onClick={handleResetFormation}>
                <RxReset />
              </Button>
            </div>

            {shouldShowDragPreview && (
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
                      {getAttendanceDisplayName(assigned.attendance)}
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
                            "rounded-full md:w-16 md:h-16 max-md:w-12 max-md:h-12 max-md:text-xs flex justify-center items-center border border-primary shadow-md font-extrabold text-lg",
                            {
                              // ["outline outline-primary"]: position.assigned,
                              "opacity-30": isDragging,
                            },
                          );
                        }}
                        style={{
                          backgroundColor: position.teamColor,
                          color: position.contrastColor,
                        }}
                      >
                        {assignMutation.isPending && position.key === selectedPositionType ? (
                          <div className="inline-flex items-center justify-center">
                            <Loading className="z-20" />
                          </div>
                        ) : (
                          <>
                            {position.assigned
                              ? getAttendanceDisplayName(position.assigned.attendance)
                              : position.key}
                          </>
                        )}
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
              matchClubId={matchClub.id}
              positionType={selectedPositionType}
              assigneds={assigneds}
              attendances={attendances}
              currentTeamId={resolvedTeamId}
              currentQuarter={currentQuarterSummary}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              onSelectedAssigned={handleSelectedAssigned}
            />
          </div>
        </section>
      </div>
    </>
  );
};

export default PositionSettingPage;
