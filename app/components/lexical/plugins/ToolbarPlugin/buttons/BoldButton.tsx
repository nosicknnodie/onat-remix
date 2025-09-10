import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscBold } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs";
import { useActiveEditor, useToolbarState } from "../Context";

interface IBoldButtonProps {}

const BoldButton = (_props: IBoldButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.isBold ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
      >
        <VscBold className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default BoldButton;
