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
import { cn } from "~/libs";

export const Settings = ({
  post,
  editTo,
}: {
  editTo: string;
  post?: (Post & { author?: User & { userImage?: File | null } }) | null;
}) => {
  const user = useSession();
  const { revalidate } = useRevalidator();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => fetch(`/api/posts/${post?.id}`, { method: "DELETE" }),
  });
  const handleDelete = async () => {
    try {
      await mutateAsync();
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
