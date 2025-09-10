import { FORMAT_TEXT_COMMAND } from "lexical";
import { HiOutlineUnderline } from "react-icons/hi2";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs";
import { useActiveEditor, useToolbarState } from "../Context";

interface IUnderlineButtonProps {}

const UnderlineButton = (_props: IUnderlineButtonProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.isUnderline ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
      >
        <HiOutlineUnderline className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default UnderlineButton;
