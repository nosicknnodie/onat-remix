import { AvatarImage } from "@radix-ui/react-avatar";
import { format } from "date-fns";
import _ from "lodash";
import { CalendarIcon, HomeIcon, KeyIcon, MailIcon, UserIcon } from "lucide-react"; // 또는 @heroicons/react 사용 가능
import { FaFutbol, FaHeartbeat } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import type { IPlayer } from "../isomorphic/types";

interface IInfoDrawerProps extends React.PropsWithChildren {
  player?: IPlayer;
}

export const InfoDrawer = ({ player, children }: IInfoDrawerProps) => {
  const compacted = _.compact([
    player?.user?.position1,
    player?.user?.position2,
    player?.user?.position3,
  ]);
  const positions = compacted.length > 0 ? compacted.join(",") : "-";
  const statusText = _.compact([
    player?.isInjury ? "부상중" : undefined,
    player?.isRest ? "휴식중" : undefined,
  ]).join(",");
  const address = _.compact([player?.user?.si, player?.user?.gun]).join(" ");

  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full justify-start flex py-0.5 px-0 h-6 text-primary"
          >
            {children}
          </Button>
        </DrawerTrigger>
        <DrawerContent
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-l-xl shadow-md sm:p-2 lg:p-10 w-full max-sm:max-w-xs sm:max-w-md mx-auto"
        >
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold mb-4 border-b pb-2">
              회원 정보 확인
            </DrawerTitle>
            <DrawerDescription>사용자 회원 정보 확인란입니다.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 pl-4 relative w-full">
            {player?.user?.userImage?.url && (
              <Avatar className="group max-sm:size-[100px] sm:size-[180px] absolute right-2 top-5 opacity-80 shadow-lg">
                <AvatarImage
                  className="object-cover"
                  src={player?.user?.userImage?.url || "/images/user_empty.png"}
                />
                <AvatarFallback>
                  <Loading />
                </AvatarFallback>
              </Avatar>
            )}
            <InfoRow
              label="이름 (닉네임)"
              value={`${player?.user?.name} (${player?.nick})`}
              icon={<UserIcon size={16} />}
            />
            <InfoRow label="포지션" value={positions} icon={<FaFutbol size={16} />} />
            <InfoRow label="상태" value={statusText} icon={<FaHeartbeat size={16} />} />
            <InfoRow label="이메일" value={player?.user?.email} icon={<MailIcon size={16} />} />
            <InfoRow label="주소" value={address} icon={<HomeIcon size={16} />} />
            <InfoRow
              label="생년월일"
              value={player?.user?.birth ? format(new Date(player.user.birth), "yyyy-MM-dd") : "-"}
              icon={<CalendarIcon size={16} />}
            />
            <InfoRow
              label="권한"
              value={
                {
                  NORMAL: "회원",
                  PENDING: "대기회원",
                  MASTER: "마스터",
                  MANAGER: "관리자",
                }[player?.role ?? "PENDING"]
              }
              icon={<KeyIcon size={16} />}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="mt-0.5 text-primary">{icon}</div>
    <div>
      <p className="text-gray-500 font-medium">{label}</p>
      <p className="text-gray-900">{value || "-"}</p>
    </div>
  </div>
);
