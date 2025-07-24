import { LexicalEditor, SerializedEditorState } from "lexical";
import { useState } from "react";
// import { Editor } from "~/components/lexical/PostEditor";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs/utils";

interface ICommentInputProps {
  className?: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
  onSubmit?: (
    root?: SerializedEditorState,
    editor?: LexicalEditor,
    parentId?: string
  ) => Promise<void | boolean>;
}

const CommentInput = ({
  className,
  onSubmit,
  onCancel,
  parentId,
  placeholder,
}: ICommentInputProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    onCancel?.();
  };
  const handleSubmit = async (
    root?: SerializedEditorState,
    editor?: LexicalEditor
  ) => {
    setIsSubmitting(true);
    await onSubmit?.(root, editor, parentId);
    setIsSubmitting(false);
  };
  return (
    <>
      <div
        className={cn(
          "border border-primary rounded-3xl overflow-hidden p-4 ",
          className
        )}
      >
        <CommentEditor
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          placeholder={placeholder || "코멘트를 입력하세요."}
          isSubmitting={isSubmitting}
        />
      </div>
    </>
  );
};

export default CommentInput;
