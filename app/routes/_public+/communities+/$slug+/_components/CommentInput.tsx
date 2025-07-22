import { LexicalEditor, SerializedEditorState } from "lexical";
import { useState } from "react";
// import { Editor } from "~/components/lexical/PostEditor";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs/utils";

interface ICommentInputProps {
  className?: string;
  onSubmit?: (
    root?: SerializedEditorState,
    editor?: LexicalEditor
  ) => Promise<void | boolean>;
}

const CommentInput = ({ className, onSubmit }: ICommentInputProps) => {
  const [isTextMode, setIsTextMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!isTextMode)
    return (
      <>
        <button
          onClick={() => setIsTextMode(true)}
          className={cn(
            "rounded-3xl w-full flex justify-start items-center border borderㅊ-primary/30 py-4 px-4 text-sm cursor-text",
            "hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5"
          )}
        >
          게시물 토론에 참여 합니다.
        </button>
      </>
    );

  const handleCancel = () => {
    setIsTextMode(false);
  };
  const handleSubmit = async (
    root?: SerializedEditorState,
    editor?: LexicalEditor
  ) => {
    setIsSubmitting(true);
    const result = await onSubmit?.(root, editor);
    setIsSubmitting(false);
    if (result !== false) {
      setIsTextMode(false);
    }
  };
  return (
    <>
      <div
        className={cn(
          "border border-primary rounded-3xl overflow-hidden p-4",
          className
        )}
      >
        <CommentEditor
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          placeholder="코멘트를 입력하세요."
        />
      </div>
    </>
  );
};

export default CommentInput;
