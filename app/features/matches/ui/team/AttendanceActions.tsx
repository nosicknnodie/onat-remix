import { type PropsWithChildren, useTransition } from "react";
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
import InfoDrawer from "./InfoDrawer";

export interface TeamAttendanceActionsProps extends PropsWithChildren {
  name: string;
  imageUrl?: string;
  isChecked?: boolean;
  teams: { id: string; name: string }[];
  currentTeamId?: string | null;
  onSelectTeam: (teamId: string) => Promise<void> | void;
}

export const TeamAttendanceActions = ({
  children,
  name,
  imageUrl,
  isChecked,
  teams,
  currentTeamId,
  onSelectTeam,
}: TeamAttendanceActionsProps) => {
  const [isPending, startTransition] = useTransition();

  const handleSelectedTeam = async (teamId: string) => {
    startTransition(async () => {
      await onSelectTeam(teamId);
    });
  };

  return (
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
          <span className="truncate max-w-[96px] flex-1">{children || name}</span>
          <div className="shrink-0">{isPending && <Loading size={16} />}</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{`${name} 님`}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <InfoDrawer payload={null}>정보확인</InfoDrawer>
        <DropdownMenuItem asChild></DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {teams.map((team) => (
              <DropdownMenuCheckboxItem
                checked={currentTeamId === team.id}
                disabled={currentTeamId === team.id}
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
  );
};

export default TeamAttendanceActions;
