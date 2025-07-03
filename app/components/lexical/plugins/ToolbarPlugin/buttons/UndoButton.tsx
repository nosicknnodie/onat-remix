import { UNDO_COMMAND } from "lexical";
import { FaUndo } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";
interface IUndoButtonProps {}

const UndoButton = (_props: IUndoButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!toolbarState.canUndo}
        className={cn("", { "bg-primary/5": toolbarState.canUndo })}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
      >
        <FaUndo
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.canUndo,
          })}
        />
      </Button>
    </>
  );
};

export default UndoButton;
