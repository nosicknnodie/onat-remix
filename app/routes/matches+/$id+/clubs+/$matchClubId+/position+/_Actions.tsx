import { Link, useLoaderData } from "@remix-run/react";
import { PropsWithChildren } from "react";
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
import { loader } from "./_index";
import { usePositionContext } from "./_position.context";

interface IActionsProps extends PropsWithChildren {
  teamId: string;
}

export const Actions = ({ children, teamId }: IActionsProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const teams = loaderData.matchClub.teams;
  const context = usePositionContext();
  const currentQuarterOrder = context.currentQuarterOrder;
  const currentTeam = teams.find((team) => team.id === teamId);
  const currentQuarter = loaderData.matchClub.quarters.find(
    (quarter) => quarter.order === currentQuarterOrder,
  );
  const team1 = currentQuarter?.team1;
  const team2 = currentQuarter?.team2;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center">
            <AiFillSkin color={currentTeam?.color} className="drop-shadow mr-1" />
            {currentTeam?.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to={{
                pathname: "./setting",
                search: `quarter=${currentQuarterOrder}&teamId=${teamId}`,
              }}
            >
              포지션 설정
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>팀 선택</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {teams.map((team) => (
                <DropdownMenuCheckboxItem
                  checked={team.id === teamId}
                  disabled={team.id === team1?.id || team.id === team2?.id}
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
