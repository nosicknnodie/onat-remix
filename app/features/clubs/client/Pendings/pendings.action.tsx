import type { Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useParams } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { confirm } from "~/components/ui/confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { IPlayer } from "../../isomorphic/types";
import { useMembershipInfoQuery } from "../../isomorphic";
import { InfoDrawer } from "../index";
import { useGetPendingPlayers } from "./pendings.context";

interface IPendingsActionProps {
  payload: IPlayer;
}

export const PendingsAction = ({ payload }: IPendingsActionProps) => {
  const { clubId } = useParams();
  const { data: player } = useMembershipInfoQuery(clubId ?? "", {
    enabled: Boolean(clubId),
  });
  const isMaster = player?.role === "MASTER";
  const isManager = player?.role === "MANAGER";
  const context = useGetPendingPlayers();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (value: Partial<Player>) => {
      return fetch(`/api/players/${payload.id}`, {
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
              {isPending ? <Loading /> : <DotsHorizontalIcon className="h-4 w-4" />}
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
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm({
                      title: "승인",
                      description: `${payload?.user?.name} 님을 승인하시겠습니까?`,
                    }).onConfirm(handleResolve);
                  }}
                  className="w-full justify-start flex py-2 px-2 h-8"
                >
                  승인
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm({
                      title: "승인 거절 확인",
                      description: `${payload?.user?.name} 님을 승인 거절하시겠습니까?`,
                    }).onConfirm(handleReject);
                  }}
                  className="w-full justify-start flex py-1 px-2 h-8"
                >
                  거절
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
