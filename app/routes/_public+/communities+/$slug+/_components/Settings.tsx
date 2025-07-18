import { Board, File, Post, User } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { Loading } from "~/components/Loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/contexts/AuthUserContext";
import { cn } from "~/libs/utils";

interface ISettingsProps {
  board?: Board | null;
  post?: (Post & { author?: User & { userImage?: File | null } }) | null;
}

const Settings = ({ board, post }: ISettingsProps) => {
  const user = useSession();
  const { revalidate } = useRevalidator();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () =>
      fetch(`/api/posts/${post?.id}`, {
        method: "DELETE",
      }),
  });
  const handleDelete = async () => {
    try {
      await mutateAsync();
      revalidate();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 text-primary focus:outline-none focus:ring-0 focus-visible:ring-0"
            )}
          >
            <span className="sr-only">Open menu</span>
            {isPending ? (
              <Loading />
            ) : (
              <DotsHorizontalIcon className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user?.id === post?.authorId && (
            <>
              <DropdownMenuItem asChild>
                <Link to={`/communities/${board?.slug}/${post?.id}/edit`}>
                  Edit
                </Link>
              </DropdownMenuItem>
              <DeleteAlertAction handleDelete={handleDelete}>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-destructive w-full h-full justify-start pl-2"
                >
                  삭제
                </Button>
              </DeleteAlertAction>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

interface IDeleteAlertActionProps extends PropsWithChildren {
  handleDelete: () => void;
}

const DeleteAlertAction = ({
  handleDelete,
  children,
}: IDeleteAlertActionProps) => {
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>삭제</AlertDialogHeader>
          <div>게시글을 삭제 하시겠습니까?</div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Settings;
