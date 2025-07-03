import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscItalic } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";

interface IItalicButtonProps {}

const ItalicButton = (_props: IItalicButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("", { "bg-primary/5": toolbarState.isItalic })}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
      >
        <VscItalic
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.isItalic,
          })}
        />
      </Button>
    </>
  );
};

export default ItalicButton;
