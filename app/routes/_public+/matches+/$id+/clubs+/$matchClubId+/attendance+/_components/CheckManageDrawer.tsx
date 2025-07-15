import { Attendance, File, Mercenary, Player, User } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import {
  ColumnDef,
  Row,
  SortingState,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import hangul from "hangul-js";
import { PropsWithChildren, useMemo, useState, useTransition } from "react";
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
import { loader } from "../_data";
import { useAttendanceContext } from "../_hook";

const CheckManageDrawer = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const loaderData = useLoaderData<typeof loader>();
  const attendances = loaderData.matchClub.attendances;
  const attendeds = attendances?.filter((att) => att.isVote);
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
  const data = useMemo(() => attendeds ?? [], [attendeds]);

  // global filter
  const globalFilterFn = (row: Row<IAttendance>, _columnId: string, filterValue: string) => {
    const name =
      row.original.player?.user?.name?.toLowerCase() ||
      row.original.mercenary?.user?.name?.toLowerCase() ||
      row.original.mercenary?.name?.toLowerCase() ||
      "";
    const search = filterValue.toLowerCase();

    return hangul.search(name, search) >= 0;
  };

  return (
    <>
      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="">
          <div className="p-2 flex flex-col">
            <DrawerHeader className="">
              <DrawerTitle>출석 관리</DrawerTitle>
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
                  columns={checkColumns}
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
                    getRowId: (row) => row.id,
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

type IAttendance = Attendance & {
  player?: (Player & { user?: (User & { userImage?: File | null }) | null }) | null;
  mercenary?: (Mercenary & { user?: (User & { userImage?: File | null }) | null }) | null;
};

const checkColumns: ColumnDef<IAttendance>[] = [
  {
    id: "name",
    accessorFn: (v) => v.player?.user?.name || v.mercenary?.user?.name || v.mercenary?.name || "",
    header() {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const imageUrl =
        row.original?.player?.user?.userImage?.url || row.original?.mercenary?.user?.userImage?.url;
      return (
        <div className="flex justify-start items-center truncate space-x-2">
          <Avatar>
            <AvatarImage src={imageUrl || "/images/user_empty.png"} />
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
    id: "isCheck",
    accessorFn: (v) => v.isCheck,
    header() {
      return <div className="flex justify-center">출석</div>;
    },
    cell: ({ row }) => <IsAttendedCellComponent payload={row.original} />,
  },
];

const IsAttendedCellComponent = ({ payload }: { payload: IAttendance }) => {
  const context = useAttendanceContext();
  const [isPending, startTransition] = useTransition();
  const [isCheck, setCheck] = useState<boolean>(payload.isCheck);

  const handleOnchange = (value: boolean) => {
    setCheck(value);
    startTransition(async () => {
      const res = await fetch("/api/attendances", {
        body: JSON.stringify({
          id: payload.id,
          isCheck: value,
        }),
        method: "POST",
      }).then((res) => res.json());
      if (res.success) {
        context?.revalidate();
      } else {
        setCheck(!value);
      }
    });
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <Switch checked={isCheck} onCheckedChange={handleOnchange} disabled={isPending} />
      </div>
    </>
  );
};

export default CheckManageDrawer;
