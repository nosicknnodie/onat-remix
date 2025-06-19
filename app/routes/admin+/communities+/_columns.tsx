import { Board } from "@prisma/client";
import { AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useRevalidator } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
export const boardColumns: ColumnDef<Board>[] = [
  {
    id: "name",
    accessorFn: (v) => v.name || "",
    header({ table }) {
      return <div className="flex justify-center">게시판 이름</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center truncate space-x-2">
          {row.getValue("name")} {!row.original.isUse && "(❌ 사용중지)"}
        </div>
      );
    },
  },
  {
    id: "slug",
    accessorFn: (v) => v.slug,
    header({ table }) {
      return <div className="flex justify-center">slug</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{row.getValue("slug")}</span>
        </div>
      );
    },
  },
  {
    id: "order",
    accessorFn: (v) => v.order,
    header({ table }) {
      return <div className="flex justify-center">우선순위</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{row.getValue("order")}</span>
        </div>
      );
    },
  },
  {
    id: "readRole",
    accessorFn: (v) => v.readRole,
    header({ table }) {
      return <div className="flex justify-center">읽기 권한</div>;
    },
    cell: ({ row }) => {
      const payload = row.original;
      const readRole = payload.readRole
        ? payload.readRole === "NORMAL"
          ? "일반 회원"
          : "관리자"
        : "전체";
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{readRole}</span>
        </div>
      );
    },
  },
  {
    id: "writeRole",
    accessorFn: (v) => v.writeRole,
    header({ table }) {
      return <div className="flex justify-center">쓰기 권한</div>;
    },
    cell: ({ row }) => {
      const payload = row.original;
      const writeRole = payload.writeRole
        ? payload.writeRole === "NORMAL"
          ? "일반 회원"
          : "관리자"
        : "전체";
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{writeRole}</span>
        </div>
      );
    },
  },
  {
    id: "type",
    accessorFn: (v) => v.type,
    header({ table }) {
      return <div className="flex justify-center">타입</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center items-center space-x-2">
          <span>{row.getValue("type")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payload = row.original;
      return <Actions payload={payload} />;
    },
  },
];

const Actions = ({ payload }: { payload: Board }) => {
  const { revalidate } = useRevalidator();
  const [isPending, startTransition] = useTransition();
  const handleDelete = async () => {
    startTransition(async () => {
      await fetch(`/api/boards/del`, {
        method: "DELETE",
        body: JSON.stringify({ ids: [payload.id] }),
      });
      revalidate();
    });
  };
  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
              // disabled={isPending}
            >
              <span className="sr-only">Open menu</span>
              {/* {isPending ? (
                <Loading />
              ) : (
              )} */}
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{payload.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {payload.isUse && (
              <>
                <Link to={`./${payload.id}`}>
                  <DropdownMenuLabel>수정</DropdownMenuLabel>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-start pl-2 text-destructive"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>삭제 요청</AlertDialogTitle>
                      <AlertDialogDescription>
                        {payload.name} 게시판을 삭제 하시겠습니까?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        확인
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
