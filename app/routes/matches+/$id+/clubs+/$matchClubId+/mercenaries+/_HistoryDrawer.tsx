import { AvatarImage } from "@radix-ui/react-avatar";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import DataTable from "~/components/DataTable";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { IMatchClubMecenaryLoaderTData } from "./_index";

interface IHistoryDrawerProps extends React.PropsWithChildren {
  payload: IMatchClubMecenaryLoaderTData[number];
}

const HistoryDrawer = ({ children, payload }: IHistoryDrawerProps) => {
  const attends = payload.attendances
    .filter((at) => at.isVote)
    .sort((a, b) =>
      dayjs(b.matchClub.match.stDate).isAfter(dayjs(a.matchClub.match.stDate)) ? 1 : -1,
    );
  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full justify-start flex py-0.5 px-0 h-6"
          >
            {children}
          </Button>
        </DrawerTrigger>
        <DrawerContent
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-l-xl shadow-md sm:p-2 lg:p-10 w-full max-sm:max-w-xs sm:max-w-md mx-auto"
        >
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold mb-4 border-b pb-2">
              최근 경기 정보
            </DrawerTitle>
            <DrawerDescription>
              {payload?.user?.name || payload.name} 용병의 최근 경기 정보 입니다.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 pl-4 relative w-full">
            {payload?.user?.userImage?.url && (
              <Avatar className="group max-sm:size-[100px] sm:size-[180px] absolute right-2 top-5 opacity-80 shadow-lg">
                <AvatarImage
                  className="object-cover"
                  src={payload?.user?.userImage?.url || "/images/user_empty.png"}
                />
                <AvatarFallback>
                  <Loading />
                </AvatarFallback>
              </Avatar>
            )}
            <div className="max-h-[calc(100vh-10rem] overflow-y-auto">
              <DataTable data={attends} columns={columns} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const columns: ColumnDef<IMatchClubMecenaryLoaderTData[number]["attendances"][number]>[] = [
  {
    id: "title",
    accessorFn: (v) => v.matchClub.match.title,
    header({ table }) {
      return <div className="flex justify-center">매치</div>;
    },
    cell: ({ row }) => {
      const title = row.original.matchClub.match.title;

      return <div className="flex justify-center">{title}</div>;
    },
  },
  {
    id: "stDate",
    accessorFn: (v) => v.matchClub.match.stDate,
    header({ table }) {
      return <div className="flex justify-center">날짜</div>;
    },
    cell: ({ row }) => {
      const stDate = row.original.matchClub.match.stDate;
      const matchDate = stDate ? dayjs(stDate).format("YYYY-MM-DD (ddd) HH:mm") : null;
      return <div className="flex justify-center">{matchDate}</div>;
    },
  },
  {
    id: "isAttended",
    accessorFn: (v) => v.matchClub.match.stDate,
    header({ table }) {
      return <div className="flex justify-center">출석정보</div>;
    },
    cell: ({ row }) => {
      const isAttended = row.original.isCheck;
      const stDate = row.original.matchClub.match.stDate;
      const isAfter = stDate ? dayjs().isAfter(stDate) : false;
      return (
        <div className="flex justify-center">
          {isAttended ? (
            <Badge variant="default">출석완료</Badge>
          ) : isAfter ? (
            <Badge variant="destructive">미출석</Badge>
          ) : (
            <Badge variant="secondary">대기</Badge>
          )}
        </div>
      );
    },
  },
];

export default HistoryDrawer;
