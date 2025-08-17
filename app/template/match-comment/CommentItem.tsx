import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import { useState, useTransition } from "react";
import { FaRegComment } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { View } from "~/components/lexical/View";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/libs/utils";
import type { IMatchClubComment } from "~/routes/api+/matchClubs+/$matchClubId+/comments";
import { useCommentInput, useGetMatchCommentsQuery, useMatchCommentContext } from "./_hooks";

interface ICommentItemProps {
  comment: Omit<IMatchClubComment, "replys">;
}

const CommentItem = ({ comment }: ICommentItemProps) => {
  const context = useMatchCommentContext();
  const query = useGetMatchCommentsQuery();
  const [replyOpen, setReplyOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleInsertImage } = useCommentInput();
  const handleSubmit = async (root?: SerializedEditorState) => {
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await fetch(`/api/matchClubs/${context.matchClubId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: root,
          matchClubId: context.matchClubId,
          parentId: comment.parentId || comment.id,
          replyToUserId: comment.user.id,
        }),
      });
      if (res.ok) {
        query.refetch();
        setReplyOpen(false);
      }
    });
    setIsSubmitting(false);
  };
  return (
    <>
      <div className="flex gap-2">
        <div className="h-10 flex items-center max-md:max-w-6">
          <Avatar className="size-8">
            <AvatarImage
              src={comment.user.userImage?.url || "/images/user_empty.png"}
            ></AvatarImage>
            <AvatarFallback className="bg-primary-foreground">
              <Loading />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="w-full space-y-0.5">
          <div className="h-10 flex items-center gap-2 ml-2 text-xs">
            <span>{comment.user.name}</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">
              {formatDistance(comment.createdAt, new Date(), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
          {comment.replyToUser && (
            <Badge variant={"secondary"} className="text-xs">
              @{comment.replyToUser.name}
            </Badge>
          )}
          <div className="w-full rounded-lg ml-2">
            <View
              editorState={
                comment.content as unknown as SerializedEditorState<SerializedLexicalNode>
              }
              className="min-h-0 "
            />
          </div>
          <div>
            <Button
              variant={"ghost"}
              onClick={() => setReplyOpen((v) => !v)}
              className="text-xs text-gray-500 flex items-center gap-2 rounded-lg"
            >
              <FaRegComment /> 답글
            </Button>
          </div>
          {replyOpen && (
            <>
              <div className={cn("border border-primary rounded-3xl overflow-hidden p-4 ")}>
                <CommentEditor
                  onCancel={() => setReplyOpen(false)}
                  onSubmit={handleSubmit}
                  onUploadImage={handleInsertImage}
                  // initialEditorState={initialEditorState}
                  placeholder={"코멘트를 입력하세요."}
                  isSubmitting={isSubmitting}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CommentItem;
