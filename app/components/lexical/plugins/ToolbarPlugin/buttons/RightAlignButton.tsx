import { FORMAT_ELEMENT_COMMAND } from "lexical";
import { MdFormatAlignRight } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";
interface IRightAlignButtonProps {}

const RightAlignButton = (_props: IRightAlignButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
      >
        <MdFormatAlignRight className={cn("size-4 text-gray-500", {})} />
      </Button>
    </>
  );
};

export default RightAlignButton;
