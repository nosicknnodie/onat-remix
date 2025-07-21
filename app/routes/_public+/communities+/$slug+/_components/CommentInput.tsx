import { SerializedEditorState } from "lexical";
import { useState } from "react";
// import { Editor } from "~/components/lexical/PostEditor";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs/utils";

interface ICommentInputProps {}

const CommentInput = (_props: ICommentInputProps) => {
  const [isTextMode, setIsTextMode] = useState(false);
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
  const handleSubmit = (root?: SerializedEditorState) => {
    console.log("root - ", root);
  };
  return (
    <>
      <div className="border border-primary rounded-3xl overflow-hidden p-4">
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
