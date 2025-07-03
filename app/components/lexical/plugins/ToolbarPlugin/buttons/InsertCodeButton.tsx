import { FORMAT_TEXT_COMMAND } from "lexical";
import { VscCode } from "react-icons/vsc";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
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
        variant="ghost"
        size="icon"
        className={cn("", { "bg-primary/5": toolbarState.isCode })}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }}
      >
        <VscCode
          className={cn("size-4 text-gray-500", {
            "font-bold text-black": toolbarState.isCode,
          })}
        />
      </Button>
    </>
  );
};

export default InsertCodeButton;
