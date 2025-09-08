import type { PropsWithChildren } from "react";
import { AiFillSkin } from "react-icons/ai";
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
import { Link } from "~/components/ui/Link";

interface TeamShape {
  id: string;
  name: string;
  color?: string | null;
}

interface PositionTeamActionsProps extends PropsWithChildren {
  teamId: string;
  teams: TeamShape[];
  currentTeam?: TeamShape | null;
  currentQuarterOrder?: number; // unused
  team1Id?: string | null;
  team2Id?: string | null;
  settingHref: string;
}

export const PositionTeamActions = ({
  children,
  teamId,
  teams,
  currentTeam,
  team1Id,
  team2Id,
  settingHref,
}: PositionTeamActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center">
          <AiFillSkin color={currentTeam?.color || undefined} className="drop-shadow mr-1" />
          {currentTeam?.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={settingHref}>포지션 설정</Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>팀 선택</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {teams.map((team) => (
              <DropdownMenuCheckboxItem
                key={team.id}
                checked={team.id === teamId}
                disabled={team.id === team1Id || team.id === team2Id}
              >
                {team.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
