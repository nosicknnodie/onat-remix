import type { Player } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession } from "~/contexts";
import { useToast } from "~/hooks";
import { postJson } from "~/libs/client/api-client";
import { getToastForError } from "~/libs/isomorphic/errors";

interface IJoinDialogProps extends PropsWithChildren {
  clubId: string;
  player?: Player;
}

export const JoinDialog = ({ children, player, clubId }: IJoinDialogProps) => {
  const user = useSession();
  const nav = useNavigate();
  const { toast } = useToast();
  const { mutateAsync } = useMutation({
    mutationFn: async (value: { nick: string }) =>
      await postJson<{ redirectTo: string }>(`/api/clubs/${clubId}/join`, value),
    onError: (e) => toast(getToastForError(e)),
  });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nick = formData.get("nick")?.toString();
    if (!nick) return;
    try {
      const data = await mutateAsync({ nick });
      // API 표준: ok=true 시 data.redirectTo를 우선 사용, 레거시 키도 보조
      const d = data as { redirectTo?: string } & { data?: { redirectTo?: string } };
      const redirectTo = d.redirectTo ?? d.data?.redirectTo ?? `/clubs/${clubId}`;
      nav(redirectTo);
    } catch (_e) {
      // onError에서 토스트 처리
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>클럽가입</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form method="post" className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-1">
            <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">
              닉네임
            </Label>
            <Input
              name="nick"
              type="text"
              required
              placeholder="입력해주세요"
              defaultValue={player?.nick ?? user?.nick ?? user?.name ?? ""}
            />
          </div>
          <Button type="submit" className="btn btn-primary w-full">
            가입 신청
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
