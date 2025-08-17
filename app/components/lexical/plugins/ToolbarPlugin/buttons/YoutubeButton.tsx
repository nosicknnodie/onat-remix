import { useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/libs/utils";
import { INSERT_YOUTUBE_COMMAND } from "../../YouTubePlugin";
import { useActiveEditor, useToolbarState } from "../Context";

interface IYoutubeButtonProps {}

const YoutubeButton = (_props: IYoutubeButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  const [link, setLink] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (toolbarState.blockType === "code") return null;
  const handleSetLink = (link: string) => {
    const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(link);
    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
    if (id != null) {
      activeEditor.dispatchCommand(INSERT_YOUTUBE_COMMAND, id);
      setOpen(false);
    } else {
      setError("Invalid link");
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant={"ghost"} size="icon">
            <FaYoutube className={cn("size-4", {})} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>유튜브 링크</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                onChange={(e) => {
                  setLink(e.target.value);
                }}
                className={cn({ "border-2 border-red-500": error })}
                value={link}
              />
              {error && <span className="text-red-500 text-xs pl-2">{error}</span>}
            </div>
            <Button onClick={() => handleSetLink(link)}>링크 추가</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YoutubeButton;
