import type { Player } from "@prisma/client";
import { useNavigate, useParams } from "@remix-run/react";
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
import { useSession } from "~/contexts/AuthUserContext";

interface IJoinDialogProps extends PropsWithChildren {
  player?: Player;
}

const JoinDialog = ({ children, player }: IJoinDialogProps) => {
  const user = useSession();
  const params = useParams();
  const nav = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: async (value: { nick: string }) =>
      await fetch(`/api/clubs/${params.id}/join`, { method: "POST", body: JSON.stringify(value) }),
  });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nick = formData.get("nick")?.toString();
    if (!nick) return;
    const response = await mutateAsync({ nick });
    const data = await response.json();
    if (data.success) nav(`/clubs/${params.id}`);
    else if (data.error && data.redirectTo) nav(data.redirectTo);
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
              defaultValue={player?.nick ?? user?.name ?? ""}
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

export default JoinDialog;
