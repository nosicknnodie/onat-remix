import { AvatarImage } from "@radix-ui/react-avatar";
import _ from "lodash";
import { UserIcon } from "lucide-react";
import { FaEnvelope, FaFutbol, FaPhone, FaRegStickyNote } from "react-icons/fa";
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

export type MercenaryUser = {
  name?: string | null;
  email?: string | null;
  userImage?: { url?: string | null } | null;
  position1?: string | null;
  position2?: string | null;
  position3?: string | null;
} | null;

export type MercenaryPayload = {
  id: string;
  name?: string | null;
  hp?: string | null;
  description?: string | null;
  position1?: string | null;
  position2?: string | null;
  position3?: string | null;
  user?: MercenaryUser;
};

interface IInfoDrawerProps extends React.PropsWithChildren {
  payload: MercenaryPayload;
}

const InfoDrawer = ({ children, payload }: IInfoDrawerProps) => {
  const compacted = payload?.user
    ? _.compact([payload?.user?.position1, payload?.user?.position2, payload?.user?.position3])
    : _.compact([payload?.position1, payload?.position2, payload?.position3]);
  const positions = compacted.length > 0 ? compacted.join(",") : "-";
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
              용병 정보 확인
            </DrawerTitle>
            <DrawerDescription>용병 정보 확인란입니다.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 pl-4 relative w-full">
            {payload?.user?.userImage?.url && (
              <Avatar className="group max-sm:size-[100px] sm:size-[180px] absolute right-2 top-5 opacity-80 shadow-lg">
                <AvatarImage
                  className="object-cover"
                  src={payload?.user?.userImage?.url || "/images/user_empty.png"}
                />
                <AvatarFallback>
                  <Loading />
                </AvatarFallback>
              </Avatar>
            )}
            <InfoRow
              label="이름"
              value={`${payload?.user?.name || payload.name} `}
              icon={<UserIcon size={16} />}
            />
            <InfoRow label="포지션" value={positions} icon={<FaFutbol size={16} />} />
            <InfoRow
              label="설명"
              value={payload?.description || undefined}
              icon={<FaRegStickyNote size={16} />}
            />
            <InfoRow
              label="휴대폰번호"
              value={payload?.hp || undefined}
              icon={<FaPhone size={16} />}
            />
            <InfoRow
              label="E-mail"
              value={payload?.user?.email || undefined}
              icon={<FaEnvelope size={16} />}
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

export default InfoDrawer;
