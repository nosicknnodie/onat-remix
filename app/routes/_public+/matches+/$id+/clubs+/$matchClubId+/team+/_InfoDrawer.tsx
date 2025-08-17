import { AvatarImage } from "@radix-ui/react-avatar";
import _ from "lodash";
import { UserIcon } from "lucide-react"; // 또는 @heroicons/react 사용 가능
import { FaFutbol } from "react-icons/fa";
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
import type { IAttendance } from "./_index";

interface IInfoDrawerProps extends React.PropsWithChildren {
  payload: IAttendance | null;
}

export const InfoDrawer = ({ payload, children }: IInfoDrawerProps) => {
  const _positions = payload?.player
    ? [
        payload?.player?.user?.position1,
        payload?.player?.user?.position2,
        payload?.player?.user?.position3,
      ]
    : payload?.mercenary?.user
      ? [
          payload?.mercenary?.user?.position1,
          payload?.mercenary?.user?.position2,
          payload?.mercenary?.user?.position3,
        ]
      : payload?.mercenary
        ? [
            payload?.mercenary?.position1,
            payload?.mercenary?.position2,
            payload?.mercenary?.position3,
          ]
        : [];
  const compacted = _.compact(_positions);
  const positions = compacted.length > 0 ? compacted.join(",") : "-";
  const name =
    payload?.player?.user?.name || payload?.mercenary?.user?.name || payload?.mercenary?.name || "";
  const imageUrl =
    payload?.player?.user?.userImage?.url ?? payload?.mercenary?.user?.userImage?.url;

  const type = payload?.player ? "player" : "mercenary";

  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full justify-start flex py-1 px-2 h-6 text-primary"
          >
            {children}
          </Button>
        </DrawerTrigger>
        <DrawerContent
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-l-xl shadow-md sm:p-2 lg:p-10 w-full max-sm:max-w-xs sm:max-w-md mx-auto"
        >
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold mb-4 border-b pb-2">정보 확인</DrawerTitle>
            <DrawerDescription>사용자 회원 정보 확인란입니다.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 pl-4 relative w-full">
            {imageUrl && (
              <Avatar className="group max-sm:size-[100px] sm:size-[180px] absolute right-2 top-5 opacity-80 shadow-lg">
                <AvatarImage className="object-cover" src={imageUrl || "/images/user_empty.png"} />
                <AvatarFallback>
                  <Loading />
                </AvatarFallback>
              </Avatar>
            )}
            <InfoRow
              label="타입"
              value={type === "player" ? "회원" : "용병"}
              icon={<UserIcon size={16} />}
            />
            <InfoRow label="이름" value={`${name}`} icon={<UserIcon size={16} />} />
            <InfoRow label="포지션" value={positions} icon={<FaFutbol size={16} />} />
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
