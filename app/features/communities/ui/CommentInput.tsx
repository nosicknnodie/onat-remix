import type { LexicalEditor, SerializedEditorState } from "lexical";
import { useState } from "react";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs";

interface ICommentInputProps {
  className?: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
  initialEditorState?: SerializedEditorState | null;
  onSubmit?: (root?: SerializedEditorState, editor?: LexicalEditor) => Promise<undefined | boolean>;
}

const CommentInput = ({
  className,
  onSubmit,
  onCancel,
  placeholder,
  initialEditorState,
}: ICommentInputProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCancel = () => onCancel?.();
  const handleSubmit = async (root?: SerializedEditorState, editor?: LexicalEditor) => {
    setIsSubmitting(true);
    await onSubmit?.(root, editor);
    setIsSubmitting(false);
  };
  const handleInsertImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/comment-image", { method: "POST", body: formData });
    return await res.json();
  };
  return (
    <div className={cn("border border-primary rounded-3xl overflow-hidden p-4 ", className)}>
      <CommentEditor
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onUploadImage={handleInsertImage}
        initialEditorState={initialEditorState}
        placeholder={placeholder || "코멘트를 입력하세요."}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CommentInput;
