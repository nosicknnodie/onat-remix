import { AvatarImage } from "@radix-ui/react-avatar";
import { format } from "date-fns";
import _ from "lodash";
import { CalendarIcon, HomeIcon, KeyIcon, MailIcon, UserIcon } from "lucide-react"; // 또는 @heroicons/react 사용 가능
import { useId, useState } from "react";
import { FaFutbol, FaHeartbeat } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession } from "~/contexts";
import { getPlayerDisplayName } from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import type { IPlayer } from "../isomorphic/types";
import { useGetPlayers } from "./Members/member.context";

interface IInfoDrawerProps extends React.PropsWithChildren {
  player?: IPlayer;
}

export const InfoDrawer = ({ player, children }: IInfoDrawerProps) => {
  const session = useSession();

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
  const displayName = getPlayerDisplayName(player);
  const nickLabel = player?.user?.name ?? player?.user?.nick ?? "";
  const canEditNick = player?.userId && session?.id ? player.userId === session.id : false;

  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            type="button"
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
            {player?.user?.userImage?.url && (
              <Avatar className="group max-sm:size-[100px] sm:size-[180px] shadow-lg">
                <AvatarImage src={player?.user?.userImage?.url || "/images/user_empty.png"} />
                <AvatarFallback>
                  <Loading />
                </AvatarFallback>
              </Avatar>
            )}
            <DrawerDescription>사용자 회원 정보 확인란입니다.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 pl-4 relative w-full">
            <InfoRow
              label="선수명 (회원이름)"
              value={`${displayName}${nickLabel ? ` (${nickLabel})` : ""}`}
              icon={<UserIcon size={16} />}
              action={
                canEditNick ? (
                  <NickChangeModal player={player}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-6 w-6"
                      // onClick={(e) => {

                      // }}
                      aria-label="닉네임 수정"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </Button>
                  </NickChangeModal>
                ) : null
              }
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
              value={(() => {
                switch (player?.role) {
                  case "MASTER":
                    return "마스터";
                  case "MANAGER":
                    return "관리자";
                  case "NORMAL":
                    return "회원";
                  case "PENDING":
                    return "대기회원";
                  default:
                    return "-";
                }
              })()}
              icon={<KeyIcon size={16} />}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const NickChangeModal = ({ player, children }: IInfoDrawerProps & React.PropsWithChildren) => {
  const playersContext = useGetPlayers();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [nickInput, setNickInput] = useState(player?.nick ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const nickInputId = useId();

  const saveNick = async () => {
    if (!player?.id) return;
    const trimmed = nickInput.trim();
    if (!trimmed) {
      toast({ title: "닉네임을 입력해주세요.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: trimmed }),
      });
      if (!res.ok) throw new Error("failed");
      toast({ title: "닉네임을 수정했어요." });
      setIsEditOpen(false);
      await playersContext?.refetch?.();
    } catch (_error) {
      toast({ title: "닉네임 수정에 실패했어요.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveNick();
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      await saveNick();
    }
  };

  return (
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogTrigger
        asChild
        onClick={(e) => {
          e.preventDefault();
          setIsEditOpen(true);
        }}
      >
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>닉네임 수정</DialogTitle>
          <DialogDescription>사용 중인 닉네임을 변경할 수 있어요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nickInputId}>닉네임</Label>
            <Input
              type="text"
              id={nickInputId}
              value={nickInput}
              onChange={(event) => setNickInput(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={32}
              placeholder="닉네임을 입력하세요"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving}>
              저장
              {isSaving && <Loading size={16} className="ml-2" />}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({
  label,
  value,
  icon,
  action,
}: {
  label: string;
  value?: string | null;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="mt-0.5 text-primary">{icon}</div>
    <div className="flex-1">
      <p className="text-gray-500 font-medium flex justify-start">
        {label}
        {action ? <span>{action}</span> : null}
      </p>
      <p className="text-gray-900">{value || "-"}</p>
    </div>
  </div>
);
