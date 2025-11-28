import { UNDO_COMMAND } from "lexical";
import { FaUndo } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/isomorphic";
import { useActiveEditor, useToolbarState } from "../Context";

interface IUndoButtonProps {}

const UndoButton = (_props: IUndoButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.canUndo ? "default" : "ghost"}
        size="icon"
        disabled={!toolbarState.canUndo}
        onClick={() => {
          activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
      >
        <FaUndo className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default UndoButton;
