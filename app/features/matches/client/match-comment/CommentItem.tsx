import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import { useState } from "react";
import { FaRegComment } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { CommentEditor } from "~/components/lexical/CommentEditor";
import { View } from "~/components/lexical/View";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { MatchClubComment } from "~/features/matches/isomorphic";
import { cn } from "~/libs";
import { useCommentInput, useCreateMatchComment, useMatchCommentContext } from "./_hooks";

const CommentItem = ({ comment }: { comment: Omit<MatchClubComment, "replys"> }) => {
  const context = useMatchCommentContext();
  const [replyOpen, setReplyOpen] = useState(false);
  const createComment = useCreateMatchComment();
  const { handleInsertImage } = useCommentInput();
  const commenter = comment.user;
  const commenterName = commenter?.name ?? "알 수 없는 사용자";
  const commenterAvatar = commenter?.userImage?.url ?? "/images/user_empty.png";

  const handleSubmit = async (root?: SerializedEditorState) => {
    if (!context.matchClubId) {
      return;
    }
    try {
      await createComment.mutateAsync({
        matchClubId: context.matchClubId,
        content: root,
        parentId: comment.parentId || comment.id,
        replyToUserId: commenter?.id ?? undefined,
      });
      setReplyOpen(false);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex gap-2">
      <div className="h-10 flex items-center max-md:max-w-6">
        <Avatar className="size-8">
          <AvatarImage src={commenterAvatar} />
          <AvatarFallback className="bg-primary-foreground">
            <Loading />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="w-full space-y-0.5">
        <div className="h-10 flex items-center gap-2 ml-2 text-xs">
          <span>{commenterName}</span>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-muted-foreground text-xs">
            {formatDistance(comment.createdAt, new Date(), { addSuffix: true, locale: ko })}
          </span>
        </div>
        {comment.replyToUser && (
          <Badge variant={"secondary"} className="text-xs">
            @{comment.replyToUser.name}
          </Badge>
        )}
        <div className="w-full rounded-lg ml-2">
          <View
            editorState={comment.content as unknown as SerializedEditorState<SerializedLexicalNode>}
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
          <div className={cn("border border-primary rounded-3xl overflow-hidden p-4 ")}>
            <CommentEditor
              onCancel={() => setReplyOpen(false)}
              onSubmit={handleSubmit}
              onUploadImage={handleInsertImage}
              placeholder={"코멘트를 입력하세요."}
              isSubmitting={createComment.isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
