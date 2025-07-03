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
        variant="ghost"
        size="icon"
        className={cn("", { "bg-primary/5": toolbarState.isStrikethrough })}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
      >
        <GoStrikethrough
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.isStrikethrough,
          })}
        />
      </Button>
    </>
  );
};

export default StrikethroughButton;
