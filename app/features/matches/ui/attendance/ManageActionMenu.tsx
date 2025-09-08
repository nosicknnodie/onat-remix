import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { FaRegCalendarCheck } from "react-icons/fa";
import { FiUserPlus } from "react-icons/fi";
import { MdFactCheck } from "react-icons/md";
import { RiTeamLine } from "react-icons/ri";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Link } from "~/components/ui/Link";
import CheckManageDrawer, { type AttendanceCheckItem } from "./CheckManageDrawer";
import MercenaryManageDrawer, { type AttendanceMercenary } from "./MercenaryManageDrawer";
import PlayerManageDrawer, { type AttendancePlayer } from "./PlayerManageDrawer";

export interface AttendanceManageActionProps {
  players: AttendancePlayer[];
  onTogglePlayer: (playerId: string, isVote: boolean) => Promise<boolean> | boolean | undefined;
  mercenaries: AttendanceMercenary[];
  onToggleMercenary: (
    mercenaryId: string,
    isVote: boolean,
  ) => Promise<boolean> | boolean | undefined;
  attendances: AttendanceCheckItem[];
  onToggleCheck: (attendanceId: string, isCheck: boolean) => Promise<boolean> | boolean | undefined;
  mercenariesHref: string;
}

const AttendanceManageAction = ({
  players,
  onTogglePlayer,
  mercenaries,
  onToggleMercenary,
  attendances,
  onToggleCheck,
  mercenariesHref,
}: AttendanceManageActionProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
        >
          <span className="sr-only">Open menu</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CheckManageDrawer attendances={attendances} onToggle={(_, v) => onToggleCheck(_, v)}>
          <Button variant="ghost" className="w-full flex justify-start pl-2">
            <MdFactCheck className="mr-2" />
            출석 관리
          </Button>
        </CheckManageDrawer>
        <PlayerManageDrawer players={players} onToggle={(id, v) => onTogglePlayer(id, v)}>
          <Button variant="ghost" className="w-full flex justify-start pl-2">
            <FaRegCalendarCheck className="mr-2" />
            참석 관리
          </Button>
        </PlayerManageDrawer>
        <MercenaryManageDrawer
          mercenaries={mercenaries}
          onToggle={(id, v) => onToggleMercenary(id, v)}
        >
          <Button variant="ghost" className="w-full flex justify-start pl-2">
            <FiUserPlus className="mr-2" />
            용병 추가
          </Button>
        </MercenaryManageDrawer>
        <Link to={mercenariesHref}>
          <DropdownMenuItem>
            <RiTeamLine className="mr-2" />
            용병 관리
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttendanceManageAction;
