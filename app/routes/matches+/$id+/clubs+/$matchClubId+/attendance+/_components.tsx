import { File, Mercenary, User } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import {
  ColumnDef,
  Row,
  SortingState,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import hangul from "hangul-js";
import {
  ComponentProps,
  PropsWithChildren,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FiUserPlus } from "react-icons/fi";
import { RiTeamLine } from "react-icons/ri";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { formatPhoneNumber, removePhoneHyphen } from "~/libs/convert";
import { cn } from "~/libs/utils";
import { loader } from "./_data";
import { useAttendanceContext } from "./_hook";

export const AttendanceGroupCard = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white space-y-2",
      className,
    )}
    {...props}
  />
);

export const AttendanceGroupCardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex items-center justify-between", className)} {...props} />
);

export const AttendanceGroupCardTitle = ({ className, ...props }: ComponentProps<"h3">) => (
  <h3 className={cn("font-semibold text-sm flex items-center gap-1", className)} {...props} />
);

export const AttendanceGroupCardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex flex-wrap gap-2", className)} {...props} />
);

export const AttendanceGroupCardItem = ({
  className,
  children,
  isChecked,
  ...props
}: ComponentProps<"div"> & { isChecked?: boolean }) => (
  <div
    className={cn("text-sm border px-3 py-1 rounded-full bg-white relative", className)}
    {...props}
  >
    {isChecked && (
      <FaCheckCircle className="text-green-500 text-sm ml-1 absolute -top-1 -right-1 bg-white" />
    )}
    {children}
  </div>
);

export const AttendanceAddMercenaryAction = () => {
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
          <AttendanceAddMercenaryDrawer>
            <Button
              variant="ghost"
              className="w-full flex justify-start pl-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FiUserPlus className="mr-2" />
              용병 추가
            </Button>
          </AttendanceAddMercenaryDrawer>
          <Link to="../mercenary">
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

const AttendanceAddMercenaryDrawer = ({ children }: PropsWithChildren) => {
  const loaderData = useLoaderData<typeof loader>();
  const attendances = loaderData.matchClub.attendances;
  const attendeds = attendances
    .filter((att) => att.mercenaryId && att.isVote)
    .map((att) => att.mercenaryId);
  const mercenaries = loaderData.matchClub.club.mercenarys.map((mer) => ({
    ...mer,
    isAttended: attendeds.includes(mer.id),
  }));
  const [, startTransition] = useTransition();
  // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
  // ]);
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
  const data = useMemo(() => mercenaries ?? [], [mercenaries]);

  // global filter
  const globalFilterFn = (row: Row<IMercenary>, _columnId: string, filterValue: string) => {
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
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="">
          <div className="p-2 flex flex-col">
            <DrawerHeader className="">
              <DrawerTitle>용병추가</DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <div className="space-y-2 flex-1 flex flex-col">
              <Input
                type="text"
                placeholder="용병 검색 (이름 or 전화번호)"
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="flex-1 max-h-[calc(100svh-10rem)] overflow-y-auto">
                <DataTable
                  data={data}
                  columns={mercenaryColumns}
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

type IMercenary = Mercenary & {
  user?: (User & { userImage?: File | null }) | null;
  isAttended: boolean;
};

const mercenaryColumns: ColumnDef<IMercenary>[] = [
  {
    id: "name",
    accessorFn: (v) => v.user?.name || v.name || "",
    header({ table }) {
      return <div className="flex justify-center">이름</div>;
    },
    cell: ({ row }) => {
      const hp = row.original?.hp;
      const user = row.original?.user;
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
    header({ table }) {
      return <div className="flex justify-center">참석여부</div>;
    },
    cell: ({ row }) => <IsAttendedCellComponent payload={row.original} />,
  },
];

const IsAttendedCellComponent = ({ payload }: { payload: IMercenary }) => {
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
      const res = await fetch("/api/attendances/mercenary/upsert", {
        body: JSON.stringify({
          matchClubId: params.matchClubId,
          mercenaryId: payload.id,
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
