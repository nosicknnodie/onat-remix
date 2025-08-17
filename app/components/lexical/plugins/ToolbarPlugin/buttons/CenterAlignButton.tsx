import { FORMAT_ELEMENT_COMMAND } from "lexical";
import { MdFormatAlignCenter } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import { useActiveEditor, useToolbarState } from "../Context";

interface ICenterAlignButtonProps {}

const CenterAlignButton = (_props: ICenterAlignButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.elementFormat === "center" ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
      >
        <MdFormatAlignCenter className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default CenterAlignButton;
