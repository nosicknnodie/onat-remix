import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscItalic } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/isomorphic";
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
        variant={toolbarState.isItalic ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
      >
        <VscItalic className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default ItalicButton;
