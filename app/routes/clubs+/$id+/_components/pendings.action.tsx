import { Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useOutletContext } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { ComponentProps, PropsWithChildren } from "react";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { IClubLayoutLoaderData } from "../_layout";
import InfoDrawer from "./InfoDrawer";
import { IPlayer } from "./members.columns";
import { useGetPendingPlayers } from "./pendings.context";

interface IPendingsActionProps {
  payload: IPlayer;
}

export const PendingsAction = ({ payload }: IPendingsActionProps) => {
  const { player } = useOutletContext<IClubLayoutLoaderData>();
  const isMaster = player?.role === "MASTER";
  const isManager = player?.role === "MANAGER";
  const context = useGetPendingPlayers();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (value: Partial<Player>) => {
      return fetch("/api/players/" + payload.id, {
        method: "POST",
        body: JSON.stringify({ ...value }),
      });
    },
  });
  const handleResolve = async () => {
    await mutateAsync({ status: "APPROVED", role: "NORMAL" });
    await context?.refetch();
  };

  const handleReject = async () => {
    await mutateAsync({ status: "REJECTED" });
    await context?.refetch();
  };

  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
              disabled={isPending}
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
            <DropdownMenuLabel>{`${payload.nick} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <InfoDrawer player={payload}>정보확인</InfoDrawer>
            </DropdownMenuItem>
            {(isMaster || isManager) && (
              <>
                <AlertDialogItem
                  title="승인 확인"
                  description={`${payload?.user?.name} 님을 승인 확인하시겠습니까?`}
                  onClick={handleResolve}
                >
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full justify-start flex py-2 px-2 h-8"
                  >
                    승인
                  </Button>
                </AlertDialogItem>
                <AlertDialogItem
                  title="승인 거절 확인"
                  description={`${payload?.user?.name} 님을 승인 거절하시겠습니까?`}
                  onClick={handleReject}
                >
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full justify-start flex py-1 px-2 h-8"
                  >
                    거절
                  </Button>
                </AlertDialogItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

interface IAlertDialogItemProps
  extends PropsWithChildren,
    ComponentProps<typeof Dialog> {
  title?: string;
  description?: string;
  onClick?: () => Promise<void>;
}
const AlertDialogItem = ({
  children,
  title,
  description,
  onClick,
  ...props
}: IAlertDialogItemProps) => {
  return (
    <>
      <Dialog {...props}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">취소</Button>
            <Button onClick={onClick}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
