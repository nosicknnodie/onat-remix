import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Link } from "~/components/ui/Link";
import HistoryDrawer, { type MercenaryPayloadWithAttendances } from "./HistoryDrawer";
import InfoDrawer, { type MercenaryPayload } from "./InfoDrawer";

type ActionsPayload = (MercenaryPayload | (MercenaryPayload & MercenaryPayloadWithAttendances)) & {
  id: string;
};

const Actions = ({ payload }: { payload: ActionsPayload }) => {
  return (
    <>
      <div className="flex justify-center">
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
            <DropdownMenuLabel>{`${payload.user?.name || payload.name || ""} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <InfoDrawer payload={payload}>정보확인</InfoDrawer>
            </DropdownMenuItem>
            {"attendances" in payload && (
              <DropdownMenuItem>
                <HistoryDrawer payload={payload as MercenaryPayloadWithAttendances}>
                  최근경기
                </HistoryDrawer>
              </DropdownMenuItem>
            )}
            <Link to={`./${payload.id}/edit`}>
              <DropdownMenuItem>정보수정</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default Actions;
