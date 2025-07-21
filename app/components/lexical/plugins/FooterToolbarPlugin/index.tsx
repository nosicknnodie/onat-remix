import { SerializedEditorState } from "lexical";
import { Button } from "~/components/ui/button";
import { useActiveEditor } from "../ToolbarPlugin/Context";
import ToolbarShowButton from "./buttons/ToolbarShowButton";

interface IFooterToolbarPluginProps {
  onCancel?: () => void;
  onSubmit?: (root?: SerializedEditorState) => void;
}

const FooterToolbarPlugin = ({
  onCancel,
  onSubmit,
}: IFooterToolbarPluginProps) => {
  const { activeEditor } = useActiveEditor();
  const handleSubmit = () => {
    activeEditor.getEditorState().read(() => {
      const json = activeEditor.getEditorState().toJSON();
      onSubmit?.(json);
    });
  };
  return (
    <>
      <div className="flex justify-between">
        <ToolbarShowButton />
        <div className="flex gap-2">
          <Button variant={"outline"} size={"sm"} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={"default"} size={"sm"} onClick={handleSubmit}>
            Subbmit
          </Button>
        </div>
      </div>
    </>
  );
};

export default FooterToolbarPlugin;
