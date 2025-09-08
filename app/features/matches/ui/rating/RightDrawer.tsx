import dayjs from "dayjs";
import { Fragment, type PropsWithChildren } from "react";
import { HiClock, HiOutlineExclamationCircle } from "react-icons/hi";
import { MdOutlineEventBusy } from "react-icons/md";
import { RiEmotionSadLine } from "react-icons/ri";
import { TbListDetails } from "react-icons/tb";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { isAttackPosition, isDefensePosition, isMiddlePosition } from "~/libs/const/position.const";
import { cn } from "~/libs/utils";

interface QuarterItem {
  id: string;
  order: number;
}

interface AttendanceItem {
  id: string;
  checkTime?: string | Date | null;
  state: "NORMAL" | "EXCUSED" | "RETIRED";
  assigneds: { quarterId: string; goals: unknown[]; position?: string | null }[];
  player?: {
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
  } | null;
  mercenary?: {
    user?: { name?: string | null; userImage?: { url?: string | null } | null } | null;
    name?: string | null;
  } | null;
}

interface RightDrawerProps extends PropsWithChildren {
  attendance: AttendanceItem;
  quarters: QuarterItem[];
  matchStDate: string | Date;
}

export const RightDrawer = ({ attendance, quarters, matchStDate, children }: RightDrawerProps) => {
  const name =
    attendance.player?.user?.name ||
    attendance.mercenary?.user?.name ||
    attendance.mercenary?.name ||
    "";
  const imageUrl =
    attendance.player?.user?.userImage?.url ||
    attendance.mercenary?.user?.userImage?.url ||
    "/images/user_empty.png";
  const isPerception = attendance.checkTime
    ? new Date(matchStDate) < new Date(attendance.checkTime)
    : new Date(matchStDate) < new Date();
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{name} 님의 경기정보 보기</DrawerTitle>
          <DrawerDescription>이번 매치에 대한 선수에 대한 각 정보화면</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-2">
          <div className="flex justify-center items-center flex-col">
            <Avatar className="md:size-24 max-md:size-16">
              <AvatarImage src={imageUrl} />
              <AvatarFallback>
                <Loading />
              </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">{name}</span>
          </div>
          <InfoRow
            label="출석시간"
            value={
              attendance.checkTime && (
                <div className="flex gap-2">
                  {dayjs(attendance.checkTime).format("MM.DD (ddd) HH:mm")}
                  {isPerception && <Badge variant={"destructive"}>지각</Badge>}
                </div>
              )
            }
            icon={<HiClock className="text-base text-primary" />}
          />
          <InfoRow
            label="상태 정보"
            value={
              <>
                {attendance.state === "EXCUSED" && (
                  <Badge variant={"destructive"} className="gap-1">
                    <MdOutlineEventBusy />
                    불참
                  </Badge>
                )}
                {attendance.state === "RETIRED" && (
                  <Badge variant={"destructive"} className="gap-1">
                    <RiEmotionSadLine />
                    리타이어
                  </Badge>
                )}
                {attendance.state === "NORMAL" && "-"}
              </>
            }
            icon={<HiOutlineExclamationCircle className="text-base text-primary" />}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-sm">
              <TbListDetails className=" text-primary" />
              <p className="text-gray-500 font-medium">쿼터별 포지션 및 득점</p>
            </div>
            <div className="space-y-1 ml-6 text-sm">
              {attendance.assigneds.length !== 0 && (
                <>
                  {quarters
                    .sort((a, b) => a.order - b.order)
                    .map((quarter, idx) => {
                      const assigned = attendance.assigneds.find(
                        (as) => as.quarterId === quarter.id,
                      );
                      const position = assigned?.position || undefined;
                      return (
                        <Fragment key={quarter.id}>
                          <div className="flex justify-between items-center border px-2 py-1 rounded bg-gray-50">
                            <div className="text-sm text-gray-700 font-medium">
                              {quarter?.order ? `쿼터 ${quarter.order}` : `쿼터 ${idx + 1}`}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={"secondary"}
                                className={cn("text-xs text-white", {
                                  "bg-red-500":
                                    position &&
                                    isAttackPosition(
                                      position as unknown as import("~/libs/const/position.const").POSITION_TYPE,
                                    ),
                                  "bg-yellow-400":
                                    position &&
                                    isMiddlePosition(
                                      position as unknown as import("~/libs/const/position.const").POSITION_TYPE,
                                    ),
                                  "bg-blue-500":
                                    position &&
                                    isDefensePosition(
                                      position as unknown as import("~/libs/const/position.const").POSITION_TYPE,
                                    ),
                                  "bg-green-500": position && position === "GK",
                                  "bg-gray-200 text-black": !position,
                                })}
                              >
                                {position || "-"}
                              </Badge>
                              {(assigned?.goals?.length || 0) > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  득점 {assigned?.goals.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Fragment>
                      );
                    })}
                </>
              )}
              {attendance.assigneds.length === 0 && (
                <p className="text-sm text-gray-400">배정된 쿼터 정보가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: React.ReactNode | null;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="mt-0.5 text-primary">{icon}</div>
    <div>
      <p className="text-gray-500 font-medium">{label}</p>
      <div className="text-gray-900">{value || "-"}</div>
    </div>
  </div>
);

export default RightDrawer;
