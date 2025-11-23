import type { File, User } from "@prisma/client";
import { useParams } from "@remix-run/react";
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
import {
  getPlayerDisplayName,
  useTogglePlayerAttendanceMutation,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { getToastForError } from "~/libs/errors";

export type AttendancePlayer = {
  id: string;
  playerNick?: string | null;
  user?: (User & { userImage?: File | null }) | null;
  isAttended: boolean;
};

interface PlayerManageDrawerProps extends PropsWithChildren {
  players: AttendancePlayer[];
}

const resolveAttendancePlayerName = (player: AttendancePlayer) => {
  return getPlayerDisplayName({ nick: player.playerNick, user: player.user ?? undefined });
};

const PlayerManageDrawer = ({ children, players }: PlayerManageDrawerProps) => {
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
  const columns = useMemo(() => playerColumns(), []);

  // global filter
  const globalFilterFn = (row: Row<AttendancePlayer>, _columnId: string, filterValue: string) => {
    const name = resolveAttendancePlayerName(row.original).toLowerCase();
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
                columns={columns}
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

const playerColumns = (): ColumnDef<AttendancePlayer>[] => [
  {
    id: "name",
    accessorFn: (v) => resolveAttendancePlayerName(v),
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
    cell: ({ row }) => <IsAttendedPlayerCellComponent payload={row.original} />,
  },
];

const IsAttendedPlayerCellComponent = ({ payload }: { payload: AttendancePlayer }) => {
  const { matchClubId } = useParams();
  const { toast } = useToast();
  const togglePlayerAttendance = useTogglePlayerAttendanceMutation(matchClubId);
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
      if (!matchClubId) {
        toast({
          title: "매치 정보를 불러오지 못했어요.",
          description: "새로고침 후 다시 시도해주세요.",
          variant: "destructive",
        });
        dispatch({ type: "rollback", payload: !value });
        return;
      }
      try {
        await togglePlayerAttendance.mutateAsync({
          matchClubId,
          playerId: payload.id,
          isVote: value,
        });
        setVote(value);
      } catch (error) {
        toast(getToastForError(error));
        dispatch({ type: "rollback", payload: !value });
        return;
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
