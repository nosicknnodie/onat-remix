import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscBold } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
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
        variant="ghost"
        size="icon"
        className={cn("", { "bg-primary/5": toolbarState.isBold })}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
      >
        <VscBold
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.isBold,
          })}
        />
      </Button>
    </>
  );
};

export default BoldButton;
