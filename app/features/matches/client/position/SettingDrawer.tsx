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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  type PositionAssignedWithAttendance,
  usePositionAssignedDeleteMutation,
  usePositionAssignMutation,
  usePositionAttendanceStateMutation,
  usePositionSettingContext,
  usePositionSettingMatchClubQuery,
} from "~/features/matches/isomorphic";
import { cn } from "~/libs";
import { isAttackPosition, isDefensePosition, isMiddlePosition } from "~/libs/const/position.const";

interface IPositionSettingDrawerProps {
  matchClubId: string;
  positionType: PositionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PositionSettingDrawer = ({
  matchClubId,
  positionType,
  open,
  onOpenChange,
}: IPositionSettingDrawerProps) => {
  const context = usePositionSettingContext();
  if (!context) {
    throw new Error("PositionSettingDrawer must be used within PositionSettingContext");
  }
  const { currentQuarter, currentTeamId, assigneds, query } = context;
  const matchClubQuery = usePositionSettingMatchClubQuery(matchClubId, {
    enabled: Boolean(matchClubId),
  });
  const assignMutation = usePositionAssignMutation(matchClubId);
  const deleteMutation = usePositionAssignedDeleteMutation(matchClubId);
  const attendanceStateMutation = usePositionAttendanceStateMutation(matchClubId);
  const teams = matchClubQuery.data?.matchClub.teams ?? [];
  const quarters = matchClubQuery.data?.matchClub.quarters ?? [];
  const assigned = assigneds?.find(
    (a) =>
      a.quarterId === currentQuarter?.id &&
      a.teamId === currentTeamId &&
      a.position === positionType,
  );
  const attendances = query.data?.attendances ?? [];
  const [teamId, setTeamId] = useState(currentTeamId);

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

  const handleSelectPosition = async (attendance: NonNullable<typeof attendancesData>[number]) => {
    if (!currentQuarter?.id) return;
    try {
      await assignMutation.mutateAsync({
        attendanceId: attendance.id,
        quarterId: currentQuarter.id,
        position: positionType,
        teamId: currentTeamId,
      });
    } catch (error) {
      console.error(error);
    }
  };
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
  const isMutating = assignMutation.isPending || deleteMutation.isPending;
  const isCancelPending = deleteMutation.isPending;
  const isStatePending = attendanceStateMutation.isPending;

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            포지션설정{" "}
            {currentTeamId && <>({teams.find((t) => t.id === currentTeamId)?.name ?? "팀 정보"})</>}
          </DrawerTitle>
          <DrawerDescription>
            {currentQuarter?.order}쿼터의 {positionType}의 포지션 설정
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-2">
          {metaLoading && (
            <div className="flex justify-center py-6">
              <Loading />
            </div>
          )}
          {assigned && (
            <>
              <h3 className="mb-2 text-base font-semibold">현재 위치 배정선수</h3>
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
            </>
          )}
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold">배정 가능 선수 리스트</h3>
            {currentTeamId && (
              <Select value={teamId ?? undefined} onValueChange={setTeamId}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <ul className="divide-y divide-gray-200">
            {attendancesData?.map((attendance) => (
              <PositionSettingRowItem
                key={attendance.id}
                attendance={attendance}
                isLoading={isMutating}
                isAssigned={false}
                quarters={quarters}
                onAssignClick={() => handleSelectPosition(attendance)}
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
        {isAssigned && (
          <span
            className={cn(
              "text-xs px-2 py-1 rounded min-w-12 text-center flex justify-center bg-green-500 text-white",
              {},
            )}
          >
            {isLoading ? <Loading size={12} className="text-white text-center" /> : "배정됨"}
          </span>
        )}
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
          isAssigned={isAssigned}
          attendance={attendance}
          onChangeState={onChangeState}
          onCancelAssigned={onCancelAssigned}
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
  isAssigned: boolean;
  attendance: PositionAssignedWithAttendance["attendance"];
  onChangeState?: (state: AttendanceState) => void;
  onCancelAssigned?: () => void;
  isStateMutating?: boolean;
  isCancelPending?: boolean;
}

const Action = ({
  isAssigned,
  attendance,
  onChangeState,
  onCancelAssigned,
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

  const handleCancelAssigned = () => {
    if (!isAssigned || !onCancelAssigned) return;
    void onCancelAssigned();
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
          {isStateMutating || isCancelPending ? (
            <Loading />
          ) : (
            <DotsHorizontalIcon className="h-4 w-4" />
          )}
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
        {isAssigned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCancelAssigned} className="text-red-500">
              배정취소
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
