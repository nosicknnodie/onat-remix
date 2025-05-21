import { Team } from "@prisma/client";
import { PropsWithChildren } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface IActionsProps extends PropsWithChildren {
  teams: Team[];
}

export const Actions = ({ teams, children }: IActionsProps) => {
  const isPending = false;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild></DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {teams.map((team) => (
                <DropdownMenuCheckboxItem
                  // checked={payload?.teamId === team.id}
                  // disabled={payload?.teamId === team.id}
                  key={team.id}
                  // onClick={() => handleSelectedTeam(team.id)}
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
