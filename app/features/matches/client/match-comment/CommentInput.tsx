import type { LexicalEditor, SerializedEditorState } from "lexical";
import { useState } from "react";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs/isomorphic";
import { useCommentInput, useCreateMatchComment, useMatchCommentContext } from "./_hooks";

const CommentInput = () => {
  const context = useMatchCommentContext();
  const createComment = useCreateMatchComment();
  const inputHook = useCommentInput();
  const [isTextMode, setIsTextMode] = useState(false);
  const handleCancel = () => setIsTextMode(false);
  const handleSubmit = async (root?: SerializedEditorState, _editor?: LexicalEditor) => {
    if (!context.matchClubId) return;
    try {
      await createComment.mutateAsync({ matchClubId: context.matchClubId, content: root });
      setIsTextMode(false);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      {!isTextMode ? (
        <button
          type="button"
          onClick={() => setIsTextMode(true)}
          className={cn(
            "rounded-3xl w-full flex justify-start items-center border borderㅊ-primary/30 py-4 px-4 text-sm cursor-text",
            "hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5",
          )}
        >
          댓글 입력하기
        </button>
      ) : (
        <div className={cn("")}>
          <CommentEditor
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            onUploadImage={inputHook.handleInsertImage}
            placeholder={"코멘트를 입력하세요."}
            isSubmitting={createComment.isPending}
          />
        </div>
      )}
    </>
  );
};

export default CommentInput;
