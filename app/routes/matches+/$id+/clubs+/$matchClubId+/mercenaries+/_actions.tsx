import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import HistoryDrawer from "./_HistoryDrawer";
import InfoDrawer from "./_InfoDrawer";
import { IMatchClubMecenaryLoaderTData } from "./_index";
const Actions = ({ payload }: { payload: IMatchClubMecenaryLoaderTData[number] }) => {
  return (
    <>
      <div className="flex justify-center">
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
            <DropdownMenuLabel>{`${payload.user?.name || payload.name} 님`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <InfoDrawer payload={payload}>정보확인</InfoDrawer>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HistoryDrawer payload={payload}>최근경기</HistoryDrawer>
            </DropdownMenuItem>
            <Link to={`./${payload.id}/edit`}>
              <DropdownMenuItem>정보수정</DropdownMenuItem>
            </Link>
            {/* <DropdownMenuItem disabled>기록(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>출석정보(개발중)</DropdownMenuItem>
            <DropdownMenuItem disabled>매치(개발중)</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default Actions;
