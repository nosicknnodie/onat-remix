import type { File, Post, User } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts";
import { cn } from "~/libs/isomorphic";

export const Settings = ({
  post,
  editTo,
  onDeleted,
}: {
  editTo: string;
  post?: (Post & { author?: (User & { userImage?: File | null }) | null }) | null;
  onDeleted?: (postId: string) => void;
}) => {
  const user = useSession();
  const { revalidate } = useRevalidator();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!post?.id) throw new Error("삭제할 게시글 정보가 없습니다.");
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.errors ?? "게시글 삭제에 실패했습니다.");
      }
      return response.json();
    },
  });
  const handleDelete = async () => {
    try {
      const postId = post?.id;
      if (!postId) return;
      await mutateAsync();
      onDeleted?.(postId);
      revalidate();
    } catch (error) {
      console.error(error);
    }
  };
  if (user?.id !== post?.authorId) return null;
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
        {user?.id === post?.authorId && (
          <>
            <DropdownMenuItem asChild>
              <Link to={editTo}>수정</Link>
            </DropdownMenuItem>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                confirm({
                  title: "삭제",
                  description: "게시글을 삭제 하시겠습니까?",
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
