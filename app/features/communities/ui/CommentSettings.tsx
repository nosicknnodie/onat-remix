import type { CommentVote, File, PostComment, User } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts/AuthUserContext";
import { confirm } from "~/libs/confirm";
import { cn } from "~/libs/utils";

type PostCommentWithExtras = PostComment & {
  author: User & { userImage: File | null };
  sumVote: number;
  currentVote?: CommentVote | null;
};

const CommentSettings = ({
  comment,
  onEditorOpen,
}: {
  comment: PostCommentWithExtras;
  onEditorOpen?: () => void;
}) => {
  const user = useSession();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => fetch(`/api/comments/${comment?.id}`, { method: "DELETE" }),
  });
  const handleDelete = async () => {
    try {
      await mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["COMMENTS_QUERY", comment.postId] });
    } catch (error) {
      console.error(error);
    }
  };
  if (user?.id !== comment?.authorId) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0",
          )}
        >
          <span className="sr-only">Open menu</span>
          {isPending ? <Loading /> : <DotsHorizontalIcon className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user?.id === comment?.authorId && (
          <>
            <DropdownMenuItem onClick={onEditorOpen}>Edit</DropdownMenuItem>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                confirm({
                  title: "삭제",
                  description: "댓글을 삭제 하시겠습니까?",
                  confirmText: "삭제",
                }).onConfirm(handleDelete);
              }}
              className="text-destructive w-full h-full justify-start pl-2"
            >
              삭제
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CommentSettings;
