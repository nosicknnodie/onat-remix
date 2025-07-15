import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";
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
import CheckManageDrawer from "./CheckManageDrawer";
import MercenaryManageDrawer from "./MercenaryManageDrawer";
import PlayerManageDrawer from "./PlayerManageDrawer";

const AttendanceAddAction = () => {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 focus:outline-none focus:ring-0 focus-visible:ring-0"
            // disabled={isPending}
          >
            <span className="sr-only">Open menu</span>
            {/* {isPending ? (
                <Loading />
                ) : (
                  )} */}
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CheckManageDrawer>
            <Button
              variant="ghost"
              className="w-full flex justify-start pl-2"
              onClick={(e) => e.stopPropagation()}
            >
              <MdFactCheck className="mr-2" />
              출석 관리
            </Button>
          </CheckManageDrawer>
          <PlayerManageDrawer>
            <Button
              variant="ghost"
              className="w-full flex justify-start pl-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaRegCalendarCheck className="mr-2" />
              참석 관리
            </Button>
          </PlayerManageDrawer>
          <MercenaryManageDrawer>
            <Button
              variant="ghost"
              className="w-full flex justify-start pl-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FiUserPlus className="mr-2" />
              용병 추가
            </Button>
          </MercenaryManageDrawer>
          <Link to="../mercenaries">
            <DropdownMenuItem>
              <RiTeamLine className="mr-2" />
              용병 관리
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AttendanceAddAction;
