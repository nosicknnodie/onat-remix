import { FORMAT_TEXT_COMMAND } from "lexical";
import { GoStrikethrough } from "react-icons/go";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";

interface IStrikethroughButtonProps {}

const StrikethroughButton = (_props: IStrikethroughButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.isStrikethrough ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
      >
        <GoStrikethrough className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default StrikethroughButton;
