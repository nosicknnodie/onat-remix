import type { AttendanceState, PositionType } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type PropsWithChildren, useEffect, useState } from "react";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  type PositionAssignedWithAttendance,
  type PositionAttendance,
  type PositionContextValue,
  useMatchClubQuery,
  usePositionAssignedDeleteMutation,
  usePositionAttendanceStateMutation,
} from "~/features/matches/isomorphic";
import { cn } from "~/libs/isomorphic";
import type { POSITION_TYPE } from "~/libs/isomorphic/const/position.const";
import {
  isAttackPosition,
  isDefensePosition,
  isMiddlePosition,
  PORMATION_POSITION_CLASSNAME,
} from "~/libs/isomorphic/const/position.const";

interface IPositionSettingDrawerProps {
  matchClubId: string;
  positionType: PositionType;
  assigneds?: PositionAssignedWithAttendance[];
  attendances: PositionAttendance[];
  currentTeamId: string | null;
  currentQuarter: Pick<NonNullable<PositionContextValue["currentQuarter"]>, "id" | "order"> | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectedAssigned?: (attendance: PositionAttendance, positionType: POSITION_TYPE) => void;
}

export const PositionSettingDrawer = ({
  matchClubId,
  positionType,
  assigneds,
  attendances,
  currentTeamId,
  currentQuarter,
  open,
  onOpenChange,
  onSelectedAssigned,
}: IPositionSettingDrawerProps) => {
  const matchClubQuery = useMatchClubQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });

  const deleteMutation = usePositionAssignedDeleteMutation(matchClubId);
  const attendanceStateMutation = usePositionAttendanceStateMutation(matchClubId);
  const teams = matchClubQuery.data?.matchClub?.teams ?? [];
  const quarters = matchClubQuery.data?.matchClub?.quarters ?? [];
  const assigned = assigneds?.find(
    (a) =>
      a.quarterId === currentQuarter?.id &&
      a.teamId === currentTeamId &&
      a.position === positionType,
  );
  const [teamId, setTeamId] = useState<string | null>(currentTeamId);

  const attendancesData = attendances
    ?.filter(
      (attendance) =>
        !attendance.assigneds.some((assigned) => assigned.quarterId === currentQuarter?.id) &&
        attendance.teamId === teamId,
    )
    .sort((a, b) => {
      const statePriority = { NORMAL: 0, EXCUSED: 1, RETIRED: 2 } as const;
      const aPriority = statePriority[a.state];
      const bPriority = statePriority[b.state];
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aAssigneds = a.assigneds.length;
      const bAssigneds = b.assigneds.length;
      if (aAssigneds !== bAssigneds) return aAssigneds - bAssigneds;
      const aTime = a.checkTime ? new Date(a.checkTime).getTime() : Infinity;
      const bTime = b.checkTime ? new Date(b.checkTime).getTime() : Infinity;
      return aTime - bTime;
    });

  useEffect(() => {
    setTeamId(currentTeamId);
  }, [currentTeamId]);

  const handleCancelAssigned = async (item: PositionAssignedWithAttendance) => {
    try {
      await deleteMutation.mutateAsync({
        id: item.id,
        attendanceId: item.attendanceId,
        quarterId: item.quarterId,
        position: item.position,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeAttendanceState = async (attendanceId: string, state: AttendanceState) => {
    try {
      await attendanceStateMutation.mutateAsync({ id: attendanceId, state });
    } catch (error) {
      console.error(error);
    }
  };

  const metaLoading = matchClubQuery.isLoading && !matchClubQuery.data;
  const isMutating = deleteMutation.isPending;
  const isCancelPending = deleteMutation.isPending;
  const isStatePending = attendanceStateMutation.isPending;
  const previewCoords = getPositionPreviewCoordinates(positionType);

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col h-full p-4 space-y-1">
        <DrawerHeader className="p-0">
          <DrawerTitle className="text-base pb-0">
            {`포지션설정 ${teams.find((t) => t.id === currentTeamId)?.name ?? "팀 정보"} ${currentQuarter?.order}쿼터`}
          </DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="w-full max-w-sm mx-auto">
          <div className="relative w-full aspect-[3/2] rounded-xl border bg-muted">
            <div className="absolute inset-0 bg-[url('/images/board.svg')] bg-cover bg-center opacity-70 rounded-xl" />
            <div
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${previewCoords.left}%`, top: `${previewCoords.top}%` }}
            >
              <span className="text-xs font-medium text-muted-foreground">현재 포지션</span>
              <div className="rounded-full px-3 py-2 text-xs font-semibold bg-white shadow">
                {positionType}
              </div>
            </div>
          </div>
        </div>
        {metaLoading && (
          <div className="flex justify-center py-6">
            <Loading />
          </div>
        )}
        <div className="space-y-2">
          {assigned ? (
            <ul className="divide-y divide-gray-200">
              <PositionSettingRowItem
                attendance={assigned.attendance}
                isLoading={isMutating}
                isAssigned={true}
                quarters={quarters}
                onChangeState={(state) =>
                  handleChangeAttendanceState(assigned.attendance.id, state)
                }
                onCancelAssigned={() => handleCancelAssigned(assigned)}
                isStateMutating={isStatePending}
                isCancelPending={isCancelPending}
              />
            </ul>
          ) : (
            <div className="border rounded-md p-4 text-sm text-muted-foreground text-center">
              현재 위치에 배정된 선수가 없습니다.
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold">선수 리스트</h3>
          {currentTeamId && (
            <Tabs value={teamId ?? undefined} onValueChange={setTeamId}>
              <TabsList>
                {teams.map((team) => (
                  <TabsTrigger key={team.id} value={team.id}>
                    {team.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <ul className="divide-y divide-gray-200 ">
            {attendancesData?.map((attendance) => (
              <PositionSettingRowItem
                key={attendance.id}
                attendance={attendance}
                isLoading={isMutating}
                isAssigned={false}
                quarters={quarters}
                onAssignClick={() => onSelectedAssigned?.(attendance, positionType)}
                onChangeState={(state) => handleChangeAttendanceState(attendance.id, state)}
                isStateMutating={isStatePending}
              />
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

interface IPositionsettingRowItem extends PropsWithChildren {
  attendance: PositionAssignedWithAttendance["attendance"];
  isAssigned: boolean;
  isLoading?: boolean;
  onAssignClick?: () => void;
  quarters: { id: string; order: number }[];
  onChangeState?: (state: AttendanceState) => void;
  onCancelAssigned?: () => void;
  isStateMutating?: boolean;
  isCancelPending?: boolean;
}

const PositionSettingRowItem = ({
  attendance,
  isAssigned,
  isLoading,
  onAssignClick,
  quarters,
  onChangeState,
  onCancelAssigned,
  isStateMutating,
  isCancelPending,
}: IPositionsettingRowItem) => {
  const imageUrl =
    attendance?.player?.user?.userImage?.url || attendance?.mercenary?.user?.userImage?.url || null;
  const name =
    attendance?.player?.user?.name ||
    attendance?.mercenary?.user?.name ||
    attendance?.mercenary?.name ||
    "";
  const assigneds = attendance.assigneds;
  const state = { NORMAL: "기용가능", EXCUSED: "불참", RETIRED: "리타이어" }[attendance.state];
  const handleCancelAssigned = () => {
    if (!isAssigned || !onCancelAssigned) return;
    void onCancelAssigned();
  };
  return (
    <li className={cn("flex flex-col gap-1 p-2 rounded-md", { "bg-green-50": isAssigned })}>
      <div className={cn("flex items-center gap-2")}>
        <Avatar>
          <AvatarImage src={imageUrl || "/images/user_empty.png"} alt={name || "Player"} />
          <AvatarFallback className="bg-primary-foreground">
            <Loading />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col gap-1">
          <span
            className={cn("font-medium", {
              "line-through opacity-70 text-gray-400": !isAssigned && attendance.state !== "NORMAL",
            })}
          >
            {name}
          </span>
        </div>
        {/* {isAssigned && (
          <span
            className={cn(
              "text-xs px-2 py-1 rounded min-w-12 text-center flex justify-center bg-green-500 text-white",
              {},
            )}
          >
            {isLoading ? <Loading size={12} className="text-white text-center" /> : "배정됨"}
          </span>
        )} */}
        {!isAssigned && attendance.state === "NORMAL" && (
          <Button
            size="sm"
            variant="default"
            onClick={onAssignClick}
            disabled={isLoading}
            className="text-xs px-2 py-0.5 h-6 rounded min-w-12 text-center flex justify-center"
          >
            배정하기
          </Button>
        )}
        {isAssigned && onCancelAssigned && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCancelAssigned}
            disabled={isCancelPending}
            className="text-xs px-2 py-0.5 h-6 rounded min-w-12 text-center flex justify-center"
          >
            {isCancelPending ? <Loading size={12} className="text-white" /> : "배정취소"}
          </Button>
        )}
        {!isAssigned && attendance.state !== "NORMAL" && (
          <span
            className={cn(
              "text-xs px-2 py-1 rounded min-w-12 text-center flex justify-center bg-yellow-500 text-white",
            )}
          >
            {state}
          </span>
        )}
        <Action
          attendance={attendance}
          onChangeState={onChangeState}
          isStateMutating={isStateMutating}
          isCancelPending={isCancelPending}
        />
      </div>
      <div className="flex gap-1 w-full items-center">
        <span className="rounded flex-1 text-xs text-center">
          ({assigneds.length}/{quarters.length})
        </span>
        {quarters.map((quarter) => {
          const position = assigneds.find(
            (assigned) => assigned.quarterId === quarter.id,
          )?.position;
          return (
            <span
              key={quarter.id}
              className={cn("h-2 rounded flex-1 border", {
                "bg-red-500": position && isAttackPosition(position),
                "bg-yellow-400": position && isMiddlePosition(position),
                "bg-blue-500": position && isDefensePosition(position),
                "bg-green-500": position && position === "GK",
                "bg-gray-200": !position,
              })}
            ></span>
          );
        })}
      </div>
    </li>
  );
};

interface IActionProps {
  attendance: PositionAssignedWithAttendance["attendance"];
  onChangeState?: (state: AttendanceState) => void;
  isStateMutating?: boolean;
  isCancelPending?: boolean;
}

const Action = ({
  attendance,
  onChangeState,
  isStateMutating = false,
  isCancelPending = false,
}: IActionProps) => {
  const name =
    attendance?.player?.user?.name ||
    attendance?.mercenary?.user?.name ||
    attendance?.mercenary?.name ||
    "";

  const handleChangeState = async (state: AttendanceState) => {
    if (!onChangeState) return;
    onChangeState(state);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
          disabled={isStateMutating || isCancelPending}
        >
          <span className="sr-only">Open menu</span>
          {isStateMutating ? <Loading /> : <DotsHorizontalIcon className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{`${name} 님`}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          disabled={isStateMutating}
          checked={attendance.state === "NORMAL"}
          onClick={() => handleChangeState("NORMAL")}
        >
          기용가능
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          disabled={isStateMutating}
          checked={attendance.state === "EXCUSED"}
          onClick={() => handleChangeState("EXCUSED")}
        >
          불참
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          disabled={isStateMutating}
          checked={attendance.state === "RETIRED"}
          onClick={() => handleChangeState("RETIRED")}
        >
          리타이어
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function getPositionPreviewCoordinates(position: POSITION_TYPE) {
  const targetClass = PORMATION_POSITION_CLASSNAME[position]?.className ?? "";
  const leftMatch = targetClass.match(/left-\[(\d+(?:\.\d+)?)%]/);
  const topMatch = targetClass.match(/top-\[(\d+(?:\.\d+)?)%]/);
  const left = leftMatch ? Number(leftMatch[1]) : 50;
  const top = topMatch ? Number(topMatch[1]) : 50;
  return { left, top };
}
