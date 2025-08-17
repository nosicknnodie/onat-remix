import type { LexicalEditor, SerializedEditorState } from "lexical";
import { Button } from "~/components/ui/button";
import { useActiveEditor, useToolbarState } from "../ToolbarPlugin/Context";
import ToolbarShowButton from "./buttons/ToolbarShowButton";

interface IFooterToolbarPluginProps {
  onCancel?: () => void;
  onSubmit?: (root?: SerializedEditorState, editor?: LexicalEditor) => void;
}

const FooterToolbarPlugin = ({ onCancel, onSubmit }: IFooterToolbarPluginProps) => {
  const { toolbarState } = useToolbarState();
  const { activeEditor } = useActiveEditor();
  const handleSubmit = () => {
    activeEditor.getEditorState().read(() => {
      const json = activeEditor.getEditorState().toJSON();
      onSubmit?.(json, activeEditor);
    });
  };

  return (
    <>
      <div className="flex justify-between">
        <ToolbarShowButton />
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={onCancel}
            disabled={toolbarState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={"default"}
            size={"sm"}
            onClick={handleSubmit}
            disabled={toolbarState.isSubmitting}
          >
            Subbmit
          </Button>
        </div>
      </div>
    </>
  );
};

export default FooterToolbarPlugin;
