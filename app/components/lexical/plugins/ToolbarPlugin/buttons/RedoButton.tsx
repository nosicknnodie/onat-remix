import { REDO_COMMAND } from "lexical";
import { FaRedo } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";

interface IRedoButtonProps {}

const RedoButton = (_props: IRedoButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.canRedo ? "default" : "ghost"}
        size="icon"
        disabled={!toolbarState.canRedo}
        onClick={() => {
          activeEditor.dispatchCommand(REDO_COMMAND, undefined);
        }}
      >
        <FaRedo className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default RedoButton;
