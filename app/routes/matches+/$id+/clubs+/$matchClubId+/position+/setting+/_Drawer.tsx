import { PositionType } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import { PropsWithChildren, useEffect, useState, useTransition } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/libs/utils";
import { usePositionSettingContext } from "./_context";
import { loader } from "./_index";

interface IPositionSettingDrawerProps {
  positionType: PositionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

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
  const attendancesData = attendances?.filter(
    (attendance) =>
      !attendance.assigneds.some((assigned) => assigned.quarterId === quarterId) &&
      attendance.teamId === teamId,
  );
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
                    imageUrl={assigned?.attendance?.player?.user?.userImage?.url || null}
                    name={
                      assigned?.attendance?.player?.user?.name ||
                      assigned.attendance.mercenary?.user?.name ||
                      assigned.attendance.mercenary?.name ||
                      ""
                    }
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
                  imageUrl={
                    attendance?.player?.user?.userImage?.url ||
                    attendance?.mercenary?.user?.userImage?.url ||
                    null
                  }
                  name={
                    attendance.player?.user?.name ||
                    attendance.mercenary?.user?.name ||
                    attendance.mercenary?.name ||
                    ""
                  }
                  isLoading={isPending}
                  isAssigned={false}
                />
              ))}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

interface IPositionsettingRowItem extends PropsWithChildren {
  imageUrl: string | null;
  name: string;
  isLoading?: boolean;
  isAssigned: boolean;
  onClick?: () => void;
}

const PositionSettingRowItem = ({
  imageUrl,
  name,
  isAssigned,
  isLoading,
  onClick,
}: IPositionsettingRowItem) => {
  return (
    <li className={cn("flex items-center gap-3 py-3 px-2", { "bg-green-50": isAssigned })}>
      {/* 프로필 이미지 */}
      <Avatar>
        <AvatarImage src={imageUrl || "/images/user_empty.png"} alt={name || "Player"} />
        <AvatarFallback className="bg-primary-foreground">
          <Loading />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 font-medium">{name}</div>
      {/* 배정여부 */}
      <Button size="sm" variant="ghost" onClick={onClick} disabled={isLoading}>
        <span
          className={cn("text-xs px-2 py-1 rounded min-w-12 text-center flex justify-center", {
            "bg-green-500 text-white": isAssigned,
          })}
        >
          {isAssigned ? (
            <>{isLoading ? <Loading size={12} className="text-white text-center" /> : "배정됨"}</>
          ) : (
            "배정하기"
          )}
        </span>
      </Button>
    </li>
  );
};
