import type { File, User } from "@prisma/client";
import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import hangul from "hangul-js";
import { type PropsWithChildren, useMemo, useOptimistic, useState, useTransition } from "react";
import DataTable from "~/components/DataTable";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";

export type AttendancePlayer = {
  id: string;
  user?: (User & { userImage?: File | null }) | null;
  isAttended: boolean;
};

interface PlayerManageDrawerProps extends PropsWithChildren {
  players: AttendancePlayer[];
  onToggle: (playerId: string, isVote: boolean) => Promise<boolean> | boolean | undefined;
}

const PlayerManageDrawer = ({ children, players, onToggle }: PlayerManageDrawerProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  // search filter
  const handleSearch = (value: string) => setGlobalFilter(value);
  const data = useMemo(() => players ?? [], [players]);

  // global filter
  const globalFilterFn = (row: Row<AttendancePlayer>, _columnId: string, filterValue: string) => {
    const name = row.original.user?.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    const email = row.original.user?.email?.toLowerCase() ?? "";
    return hangul.search(name, search) >= 0 || email.includes(search);
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="p-2 flex flex-col">
          <DrawerHeader>
            <DrawerTitle>회원 참석 추가</DrawerTitle>
            <DrawerDescription />
          </DrawerHeader>
          <div className="space-y-2 flex-1 flex flex-col">
            <Input
              type="text"
              placeholder="Search"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="flex-1 max-h-[calc(100svh-10rem)] overflow-y-auto">
              <DataTable
                data={data}
                columns={playerColumns(onToggle)}
                options={{
                  state: {
                    globalFilter,
                    sorting,
                  },
                  onSortingChange: setSorting,
                  getFilteredRowModel: getFilteredRowModel(),
                  getSortedRowModel: getSortedRowModel(),
                  globalFilterFn,
                }}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const playerColumns = (
  onToggle: (playerId: string, isVote: boolean) => Promise<boolean> | boolean | undefined,
): ColumnDef<AttendancePlayer>[] => [
  {
    id: "name",
    accessorFn: (v) => v.user?.name,
    header() {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-start items-center truncate space-x-2">
          <Avatar>
            <AvatarImage src={row.original?.user?.userImage?.url || "/images/user_empty.png"} />
            <AvatarFallback className="bg-primary-foreground">
              <Loading />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex space-x-2 items-center h-5">
              <span className="text-base font-semibold">{row.getValue("name")}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "isAttended",
    accessorFn: (v) => v.isAttended,
    header() {
      return <div className="flex justify-center">참석여부</div>;
    },
    cell: ({ row }) => (
      <IsAttendedPlayerCellComponent
        payload={row.original}
        onToggle={(value) => onToggle(row.original.id, value)}
      />
    ),
  },
];

const IsAttendedPlayerCellComponent = ({
  payload,
  onToggle,
}: {
  payload: AttendancePlayer;
  onToggle: (value: boolean) => Promise<boolean> | boolean | undefined;
}) => {
  const [isPending, startTransition] = useTransition();
  const [isVote, setVote] = useState<boolean>(payload.isAttended);
  const [optimistic, dispatch] = useOptimistic(
    isVote,
    (state, action: { type: string; payload: boolean }) => {
      switch (action.type) {
        case "changed":
          return action.payload;
        case "rollback":
          return action.payload;
        default:
          return state;
      }
    },
  );

  const handleOnchange = (value: boolean) => {
    startTransition(async () => {
      dispatch({ type: "changed", payload: value });
      const res = (await onToggle(value)) ?? true;
      if (res) {
        setVote(value);
      } else {
        dispatch({ type: "rollback", payload: !value });
      }
    });
  };

  return (
    <div className="flex justify-center items-center">
      <Switch
        name="isVote"
        checked={optimistic}
        onCheckedChange={handleOnchange}
        disabled={isPending}
      />
    </div>
  );
};

export default PlayerManageDrawer;
