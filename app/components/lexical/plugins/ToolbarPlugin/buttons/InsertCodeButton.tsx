import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscCode } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs";
import { useActiveEditor, useToolbarState } from "../Context";

interface IInsertCodeButtonProps {}

const InsertCodeButton = (_props: IInsertCodeButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.isCode ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }}
      >
        <VscCode className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default InsertCodeButton;
