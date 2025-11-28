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
import { useToggleAttendanceStateMutation } from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { getToastForError } from "~/libs/isomorphic/errors";

export type AttendanceCheckItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  isCheck: boolean;
};

interface CheckManageDrawerProps extends PropsWithChildren {
  attendances: AttendanceCheckItem[];
}

const CheckManageDrawer = ({ children, attendances }: CheckManageDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  const handleSearch = (value: string) => setGlobalFilter(value);
  const data = useMemo(() => attendances ?? [], [attendances]);
  const columns = useMemo(() => checkColumns(), []);

  const globalFilterFn = (
    row: Row<AttendanceCheckItem>,
    _columnId: string,
    filterValue: string,
  ) => {
    const name = row.original.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    return hangul.search(name, search) >= 0;
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="p-2 flex flex-col">
          <DrawerHeader>
            <DrawerTitle>출석 관리</DrawerTitle>
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
                  state: { globalFilter, sorting },
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
  );
};

const checkColumns = (): ColumnDef<AttendanceCheckItem>[] => [
  {
    id: "name",
    accessorFn: (v) => v.name,
    header() {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
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

const IsAttendedCellComponent = ({ payload }: { payload: AttendanceCheckItem }) => {
  const { matchClubId } = useParams();
  const { toast } = useToast();
  const toggleAttendanceState = useToggleAttendanceStateMutation(matchClubId);
  const [isPending, startTransition] = useTransition();
  const [isCheck, setCheck] = useState<boolean>(payload.isCheck);
  const [optimistic, dispatch] = useOptimistic(
    isCheck,
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
        await toggleAttendanceState.mutateAsync({
          id: payload.id,
          isCheck: value,
        });
        setCheck(value);
      } catch (error) {
        toast(getToastForError(error));
        dispatch({ type: "rollback", payload: !value });
      }
    });
  };
  return (
    <div className="flex justify-center items-center">
      <Switch checked={optimistic} onCheckedChange={handleOnchange} disabled={isPending} />
    </div>
  );
};

export default CheckManageDrawer;
