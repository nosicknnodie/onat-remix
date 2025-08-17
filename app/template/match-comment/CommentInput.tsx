import type { LexicalEditor, SerializedEditorState } from "lexical";
import { useState, useTransition } from "react";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { cn } from "~/libs/utils";
import { useCommentInput, useGetMatchCommentsQuery, useMatchCommentContext } from "./_hooks";

interface ICommentInputProps {}

const CommentInput = (_props: ICommentInputProps) => {
  const context = useMatchCommentContext();
  const query = useGetMatchCommentsQuery();
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputHook = useCommentInput();
  const [isTextMode, setIsTextMode] = useState(false);
  const handleCancel = () => {
    setIsTextMode(false);
  };
  const handleSubmit = async (root?: SerializedEditorState, _editor?: LexicalEditor) => {
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await fetch(`/api/matchClubs/${context.matchClubId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: root,
          matchClubId: context.matchClubId,
        }),
      });
      if (res.ok) {
        setIsTextMode(false);
        query.refetch();
      }
    });
    setIsSubmitting(false);
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
        <>
          <div className={cn("border border-primary rounded-3xl overflow-hidden p-4 ")}>
            <CommentEditor
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              onUploadImage={inputHook.handleInsertImage}
              // initialEditorState={initialEditorState}
              placeholder={"코멘트를 입력하세요."}
              isSubmitting={isSubmitting}
            />
          </div>
        </>
      )}
    </>
  );
};

export default CommentInput;
