import { useLoaderData, useRevalidator } from "@remix-run/react";
import { PropsWithChildren, useTransition } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { InfoDrawer } from "./_InfoDrawer";
import { IAttendance, loader } from "./_index";

interface ITeamAttendanceActionsProps extends PropsWithChildren {
  payload: IAttendance | null;
}

export const TeamAttendanceActions = ({ payload, children }: ITeamAttendanceActionsProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const [isPending, startTransition] = useTransition();
  const { revalidate } = useRevalidator();
  const teams = loaderData.teams;
  const name =
    payload?.player?.user?.name || payload?.mercenary?.user?.name || payload?.mercenary?.name || "";
  const isChecked = payload?.isCheck || false;

  const imageUrl =
    payload?.player?.user?.userImage?.url || payload?.mercenary?.user?.userImage?.url;

  const handleSelectedTeam = async (teamId: string) => {
    startTransition(async () => {
      await fetch("/api/attendances/team", {
        method: "POST",
        body: JSON.stringify({
          teamId: teamId,
          attendanceIds: [payload?.id],
        }),
      });
      revalidate();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="focus:outline-none focus:ring-0 focus-visible:ring-0 gap-1 relative flex justify-between items-center"
            disabled={isPending}
          >
            {isChecked && (
              <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-transparent" />
            )}
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={imageUrl || "/images/user_empty.png"} />
              <AvatarFallback className="bg-primary-foreground">
                <Loading size={16} />
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[96px] flex-1">{children}</span>
            <div className="shrink-0">{isPending && <Loading size={16} />}</div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{`${name} 님`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <InfoDrawer payload={payload}>정보확인</InfoDrawer>
          <DropdownMenuItem asChild></DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {teams.map((team) => (
                <DropdownMenuCheckboxItem
                  checked={payload?.teamId === team.id}
                  disabled={payload?.teamId === team.id}
                  key={team.id}
                  onClick={() => handleSelectedTeam(team.id)}
                >
                  {team.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
