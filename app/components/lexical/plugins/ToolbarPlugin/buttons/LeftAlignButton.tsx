import { FORMAT_ELEMENT_COMMAND } from "lexical";
import { MdFormatAlignLeft } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";

interface ILeftAlignButtonProps {}

const LeftAlignButton = (_props: ILeftAlignButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.elementFormat === "left" ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
      >
        <MdFormatAlignLeft className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default LeftAlignButton;
