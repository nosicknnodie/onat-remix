import { useLoaderData, useRevalidator } from "@remix-run/react";
import { PropsWithChildren, useTransition } from "react";
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
            variant="ghost"
            className="focus:outline-none focus:ring-0 focus-visible:ring-0 "
            disabled={isPending}
          >
            <span className="sr-only">Open menu</span>
            {children}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{`${name} 님`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <InfoDrawer payload={payload}>정보확인</InfoDrawer>
          <DropdownMenuItem asChild>
            {/* <InfoDrawer player={payload}>정보확인</InfoDrawer> */}
          </DropdownMenuItem>
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
          {/* <DropdownMenuItem disabled>기록(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>출석정보(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>매치(개발중)</DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
