import { FORMAT_TEXT_COMMAND } from "lexical";
import { HiOutlineUnderline } from "react-icons/hi2";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";
interface IUnderlineButtonProps {}

const UnderlineButton = (_props: IUnderlineButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("", { "bg-primary/5": toolbarState.isUnderline })}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
      >
        <HiOutlineUnderline
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.isUnderline,
          })}
        />
      </Button>
    </>
  );
};

export default UnderlineButton;
