import { RiTextBlock } from "react-icons/ri";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs";
import { useToolbarState } from "../../ToolbarPlugin/Context";

interface IToolbarShowButtonProps {}

const ToolbarShowButton = (_props: IToolbarShowButtonProps) => {
  const { toolbarState, updateToolbarState } = useToolbarState();
  // const { activeEditor } = useActiveEditor();
  // if (toolbarState.blockType === "code") return null;
  return (
    <>
      <Button
        type="button"
        variant={toolbarState.isToolbarVisible ? "default" : "ghost"}
        size="icon"
        onClick={() => {
          updateToolbarState("isToolbarVisible", !toolbarState.isToolbarVisible);
        }}
      >
        <RiTextBlock className={cn("size-4", {})} />
      </Button>
    </>
  );
};

export default ToolbarShowButton;
