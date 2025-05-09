import { Player } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useOutletContext } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { IClubLayoutLoaderData } from "../_layout";
import { useGetPlayers } from "./member.context";
import { IPlayer } from "./members.columns";

interface IPendingsActionProps {
  payload: IPlayer;
}

export const PendingsAction = ({ payload }: IPendingsActionProps) => {
  const { player } = useOutletContext<IClubLayoutLoaderData>();
  const isMaster = player?.role === "MASTER";
  const isManager = player?.role === "MANAGER";
  const isNormal = player?.role === "NORMAL";
  const context = useGetPlayers();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (value: Partial<Player>) => {
      return fetch("/api/players/" + payload.id, {
        method: "POST",
        body: JSON.stringify({ ...value }),
      });
    },
  });
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
            <DropdownMenuItem disabled>정보확인(개발중)</DropdownMenuItem>
            {(isMaster || isManager) && (
              <>
                <DropdownMenuItem>승인</DropdownMenuItem>
                <DropdownMenuItem>거절</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
