import { Team } from "@prisma/client";
import { useRevalidator } from "@remix-run/react";
import { useState, useTransition } from "react";
import { HexColorPicker } from "react-colorful";
import { AiFillSkin } from "react-icons/ai";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface IEditDialogProps extends React.PropsWithChildren {
  payload: Team | null;
}

const EditDialog = ({ children, payload }: IEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(payload?.color ?? "#000000");
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(payload?.name);
  const { revalidate } = useRevalidator();
  const handleTeamUpdate = async () => {
    startTransition(async () => {
      const res = await fetch("/api/teams/" + payload?.id, {
        method: "POST",
        body: JSON.stringify({
          name: name,
          color: color,
        }),
      });
      const data = await res.json();
      if (data.success) {
        revalidate();
        setOpen(false);
      }
    });
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 편집</DialogTitle>
            <DialogDescription>팀이름 및 팀색상을 변경 할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">팀 이름</Label>
              <Input
                id="team-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex gap-2">
                유니폼색상
                <AiFillSkin className="drop-shadow" color={color} />
              </Label>
              <HexColorPicker color={color} onChange={setColor}></HexColorPicker>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button className="w-full" onClick={handleTeamUpdate} disabled={isPending}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditDialog;
