import type { File, Player, User } from "@prisma/client";
import { useLoaderData, useParams } from "@remix-run/react";
import {
  type ColumnDef,
  getFilteredRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
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
import type { loader } from "../_data";
import { useAttendanceContext } from "../_hook";

type IPlayer = Player & {
  user?: (User & { userImage?: File | null }) | null;
  isAttended: boolean;
};

const PlayerManageDrawer = ({ children }: PropsWithChildren) => {
  const loaderData = useLoaderData<typeof loader>();
  const attendances = loaderData.matchClub.attendances;
  const attendeds = attendances
    .filter((att) => att.player && att.isVote)
    .map((att) => att.playerId);

  const players = loaderData.matchClub.club.players.map((player) => ({
    ...player,
    isAttended: attendeds.includes(player.id),
  }));
  const [, startTransition] = useTransition();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  // seatch filter
  const handleSearch = (value: string) => {
    startTransition(() => {
      setGlobalFilter(value);
    });
  };
  const data = useMemo(() => players ?? [], [players]);

  // global filter
  const globalFilterFn = (row: Row<IPlayer>, _columnId: string, filterValue: string) => {
    const name = row.original.user?.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    const email = row.original.user?.email?.toLowerCase() ?? "";

    return hangul.search(name, search) >= 0 || email.includes(search);
  };

  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="">
          <div className="p-2 flex flex-col">
            <DrawerHeader className="">
              <DrawerTitle>회원 참석 추가</DrawerTitle>
              <DrawerDescription></DrawerDescription>
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
                  columns={playerColumns}
                  options={{
                    state: {
                      // columnFilters: columnFilters,
                      globalFilter: globalFilter,
                      sorting: sorting,
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
    </>
  );
};

const playerColumns: ColumnDef<IPlayer>[] = [
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
              {/* {user?.email && (
                <>
                  <Separator orientation="vertical" />
                  <span className="text-sm">{user?.email}</span>
                </>
              )} */}
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

const IsAttendedPlayerCellComponent = ({ payload }: { payload: IPlayer }) => {
  const context = useAttendanceContext();
  const params = useParams();
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
      const res = await fetch("/api/attendances/player", {
        body: JSON.stringify({
          matchClubId: params.matchClubId,
          playerId: payload.id,
          isVote: value,
        }),
        method: "POST",
      }).then((res) => res.json());
      if (res.success) {
        setVote(value);
        context?.revalidate();
      } else {
        dispatch({ type: "rollback", payload: !value });
      }
    });
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <Switch
          name="isVote"
          checked={optimistic}
          onCheckedChange={handleOnchange}
          disabled={isPending}
        />
      </div>
    </>
  );
};

export default PlayerManageDrawer;
