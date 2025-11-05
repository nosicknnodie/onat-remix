import type { AttendanceState, PositionType } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useLoaderData } from "@remix-run/react";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
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
import { cn } from "~/libs";
import { isAttackPosition, isDefensePosition, isMiddlePosition } from "~/libs/const/position.const";
import { type IAssignedWithAttendance, usePositionSettingContext } from "./_context";
import type { loader } from "./_index";

interface IPositionSettingDrawerProps {
  positionType: PositionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PositionSettingDrawerContext = createContext<
  { assigned: IAssignedWithAttendance | undefined } | undefined
>(undefined);

export const PositionSettingDrawer = ({
  positionType,
  open,
  onOpenChange,
}: IPositionSettingDrawerProps) => {
  const [isPending, startTransition] = useTransition();
  const loaderData = useLoaderData<typeof loader>();
  const matchClub = loaderData.matchClub;
  const context = usePositionSettingContext();
  const attendances = context.query.data?.attendances;
  const quarterId = context.currentQuarter?.id;
  const currentTeamId = context.currentTeamId;
  // 배정가능 선수 리스트의 팀선택 상태
  const [teamId, setTeamId] = useState(currentTeamId);
  const attendancesData = attendances
    ?.filter(
      (attendance) =>
        !attendance.assigneds.some((assigned) => assigned.quarterId === quarterId) &&
        attendance.teamId === teamId,
    )
    .sort((a, b) => {
      const statePriority = {
        NORMAL: 0,
        EXCUSED: 1,
        RETIRED: 2,
      };
      const aPriority = statePriority[a.state];
      const bPriority = statePriority[b.state];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const aAssigneds = a.assigneds.length;
      const bAssigneds = b.assigneds.length;

      if (aAssigneds !== bAssigneds) {
        return aAssigneds - bAssigneds;
      }

      const aTime = a.checkTime ? new Date(a.checkTime).getTime() : Infinity;
      const bTime = b.checkTime ? new Date(b.checkTime).getTime() : Infinity;

      return aTime - bTime;
    });
  const assigned = context.assigneds?.find(
    (_assigned) =>
      _assigned.quarterId === quarterId &&
      _assigned.teamId === currentTeamId &&
      _assigned.position === positionType,
  );
  /**
   * 배정하기 핸들러
   */
  const handleSelectPosition = (attendance: NonNullable<typeof attendancesData>[number]) => {
    startTransition(async () => {
      if (assigned) {
        await fetch("/api/assigneds", {
          method: "DELETE",
          body: JSON.stringify({
            id: assigned.id,
            attendanceId: attendance.id,
            quarterId: quarterId,
            position: positionType,
          }),
        });
      }
      await fetch("/api/assigneds", {
        method: "POST",
        body: JSON.stringify({
          attendanceId: attendance.id,
          quarterId: quarterId,
          position: positionType,
          teamId: context?.currentTeamId,
        }),
      });
      await context.query.refetch();
    });
  };
  useEffect(() => {
    setTeamId(currentTeamId);
  }, [currentTeamId]);

  return (
    <>
      <PositionSettingDrawerContext.Provider value={{ assigned }}>
        <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
          {/* <DrawerTrigger asChild>{children}</DrawerTrigger> */}
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                포지션설정{" "}
                {currentTeamId && (
                  <>({matchClub.teams.find((team) => team.id === currentTeamId)?.name})</>
                )}
              </DrawerTitle>
              <DrawerDescription>
                {context.currentQuarter?.order}쿼터의 {positionType}의 포지션 설정
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              {assigned && (
                <>
                  <h3 className="mb-2 text-base font-semibold">현재 위치 배정선수</h3>
                  <ul className="divide-y divide-gray-200">
                    <PositionSettingRowItem
                      attendance={assigned.attendance}
                      isLoading={isPending}
                      isAssigned={true}
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
                      {matchClub.teams.map((team) => (
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
                    onClick={() => handleSelectPosition(attendance)}
                    key={attendance.id}
                    attendance={attendance}
                    isLoading={isPending}
                    isAssigned={false}
                  />
                ))}
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      </PositionSettingDrawerContext.Provider>
    </>
  );
};

interface IPositionsettingRowItem extends PropsWithChildren {
  attendance: IAssignedWithAttendance["attendance"];
  isAssigned: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

const PositionSettingRowItem = ({
  attendance,
  isAssigned,
  isLoading,
  onClick,
}: IPositionsettingRowItem) => {
  const imageUrl =
    attendance?.player?.user?.userImage?.url || attendance?.mercenary?.user?.userImage?.url || null;
  const name =
    attendance?.player?.user?.name ||
    attendance?.mercenary?.user?.name ||
    attendance?.mercenary?.name ||
    "";
  const assigneds = attendance.assigneds;
  const loaderData = useLoaderData<typeof loader>();
  const quarters = loaderData.matchClub.quarters.sort((a, b) => a.order - b.order);
  const state = {
    NORMAL: "기용가능",
    EXCUSED: "불참",
    RETIRED: "리타이어",
  }[attendance.state];
  return (
    <li
      className={cn("flex flex-col gap-1 p-2 rounded-md", {
        "bg-green-50": isAssigned,
      })}
    >
      <div className={cn("flex items-center gap-2")}>
        {/* 프로필 이미지 */}
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
        {/* 배정여부 */}
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
            onClick={onClick}
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

        <Action isAssigned={isAssigned} attendance={attendance} />
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
  attendance: IAssignedWithAttendance["attendance"];
}
const Action = ({ isAssigned, attendance }: IActionProps) => {
  const context = usePositionSettingContext();
  const positionContext = useContext(PositionSettingDrawerContext);
  const [isPending, startTransition] = useTransition();
  const name =
    attendance?.player?.user?.name ||
    attendance?.mercenary?.user?.name ||
    attendance?.mercenary?.name ||
    "";

  const handleChangeState = (state: AttendanceState) => {
    startTransition(async () => {
      await fetch("/api/attendances", {
        method: "PUT",
        body: JSON.stringify({
          id: attendance.id,
          state,
        }),
      });
      await context?.query.refetch();
    });
  };

  const handleCancelAssigned = () => {
    startTransition(async () => {
      if (isAssigned && positionContext?.assigned) {
        await fetch("/api/assigneds", {
          method: "DELETE",
          body: JSON.stringify({
            id: positionContext?.assigned.id,
            attendanceId: attendance.id,
            quarterId: positionContext?.assigned.quarterId,
            position: positionContext?.assigned.position,
          }),
        });
      }
      await context.query.refetch();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
            disabled={isPending}
          >
            <span className="sr-only">Open menu</span>
            {isPending ? <Loading /> : <DotsHorizontalIcon className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{`${name} 님`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem>정보확인</DropdownMenuItem> */}
          <DropdownMenuCheckboxItem
            disabled={isPending}
            checked={attendance.state === "NORMAL"}
            onClick={() => handleChangeState("NORMAL")}
          >
            기용가능
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            disabled={isPending}
            checked={attendance.state === "EXCUSED"}
            onClick={() => handleChangeState("EXCUSED")}
          >
            불참
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            disabled={isPending}
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
    </>
  );
};
