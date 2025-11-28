import type { File, User } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import hangul from "hangul-js";
import { type PropsWithChildren, useMemo, useOptimistic, useState, useTransition } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import DataTable from "~/components/DataTable";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
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
  attendanceQueryKeys,
  type MercenaryFormValues,
  useCreateMercenaryMutation,
  useToggleMercenaryAttendanceMutation,
} from "~/features/matches/isomorphic";
import { useToast } from "~/hooks";
import { formatPhoneNumber, removePhoneHyphen } from "~/libs/isomorphic";
import { getToastForError } from "~/libs/isomorphic/errors";
import SetMercenaryDialog from "../mercenaries/New/SetMercenaryDialog";

export type AttendanceMercenary = {
  id: string;
  name?: string | null;
  hp?: string | null;
  user?: (User & { userImage?: File | null; email?: string | null }) | null;
  isAttended: boolean;
};

interface MercenaryManageDrawerProps extends PropsWithChildren {
  mercenaries: AttendanceMercenary[];
}

const MercenaryManageDrawer = ({ children, mercenaries }: MercenaryManageDrawerProps) => {
  const { clubId, matchClubId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createMercenary } = useCreateMercenaryMutation(clubId);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);
  const data = useMemo(() => mercenaries ?? [], [mercenaries]);
  const columns = useMemo(() => mercenaryColumns(), []);
  const handleSearch = (value: string) => setGlobalFilter(value);

  const handleCreateMercenary = async (values: MercenaryFormValues) => {
    try {
      const result = await createMercenary(values);
      if (result.ok) {
        toast({
          title: "용병을 추가했어요.",
          description: `${values.name} 용병을 목록에 추가했습니다.`,
        });
        if (matchClubId) {
          await queryClient.invalidateQueries({
            queryKey: attendanceQueryKeys.detail(matchClubId),
          });
        }
        return true;
      }
      toast({
        title: "용병 추가 실패",
        description: result.message,
        variant: "destructive",
      });
      return false;
    } catch (error) {
      toast(getToastForError(error));
      return false;
    }
  };

  const globalFilterFn = (
    row: Row<AttendanceMercenary>,
    _columnId: string,
    filterValue: string,
  ) => {
    const name = row.original.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    const hp = row.original.hp?.toLowerCase() ?? "";
    const email = row.original.user?.email?.toLowerCase() ?? "";
    const convertHp = removePhoneHyphen(hp);
    const searchHp = removePhoneHyphen(search);
    return (
      hangul.search(name, search) >= 0 || convertHp.includes(searchHp) || email.includes(search)
    );
  };
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="p-2 flex flex-col">
          <DrawerHeader>
            <DrawerTitle>용병추가</DrawerTitle>
            <DrawerDescription />
          </DrawerHeader>
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex w-full space-x-1">
              <Input
                type="text"
                placeholder="검색"
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-grow"
              />
              <Button size="icon" onClick={() => handleSearch(globalFilter)}>
                <FaSearch />
              </Button>
              <SetMercenaryDialog onSubmit={handleCreateMercenary}>
                <Button size="icon">
                  <FaPlus />
                </Button>
              </SetMercenaryDialog>
            </div>
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

const mercenaryColumns = (): ColumnDef<AttendanceMercenary>[] => [
  {
    id: "name",
    accessorFn: (v) => v.user?.name || v.name || "",
    header() {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const hp = row.original?.hp;
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
            {hp && (
              <div className="flex space-x-2 items-center h-5">
                <span className="text-sm">{formatPhoneNumber(hp)}</span>
              </div>
            )}
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
    cell: ({ row }) => <IsAttendedCellComponent payload={row.original} />,
  },
];

const IsAttendedCellComponent = ({ payload }: { payload: AttendanceMercenary }) => {
  const { matchClubId } = useParams();
  const { toast } = useToast();
  const toggleMercenaryAttendance = useToggleMercenaryAttendanceMutation(matchClubId);
  const [, startTransition] = useTransition();
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
        await toggleMercenaryAttendance.mutateAsync({
          matchClubId,
          mercenaryId: payload.id,
          isVote: value,
        });
        setVote(value);
      } catch (error) {
        toast(getToastForError(error));
        dispatch({ type: "rollback", payload: !value });
      }
    });
  };

  return (
    <div className="flex justify-center items-center">
      <Switch name="isVote" checked={optimistic} onCheckedChange={handleOnchange} />
    </div>
  );
};

export default MercenaryManageDrawer;
