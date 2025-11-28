import { useParams } from "@remix-run/react";
import type { Row, SortingState } from "@tanstack/react-table";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import Hangul from "hangul-js";
import { useMemo, useState, useTransition } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import DataTable from "~/components/DataTable";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { mercenaryColumns, SetMercenaryDialog } from "~/features/matches/client";
import type { MercenaryFormValues } from "~/features/matches/isomorphic";
import {
  getMercenaryDisplayName,
  useCreateMercenaryMutation,
  useMercenariesQuery,
} from "~/features/matches/isomorphic";
import { useIsMobile } from "~/hooks/use-mobile";
import { removePhoneHyphen } from "~/libs/isomorphic/convert";
export const handle = { breadcrumb: "용병" };
const MercenaryPage = () => {
  const { clubId } = useParams();
  const { data, isLoading } = useMercenariesQuery(clubId);
  const { mutateAsync: createMercenary } = useCreateMercenaryMutation(clubId);
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  const mercenaries = data?.mercenaries ?? [];
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "attendance", desc: true },
    { id: "name", desc: false },
  ]);

  const tableData = useMemo(() => {
    return mercenaries.map((mer) => ({
      id: mer.id,
      name: getMercenaryDisplayName(mer) || undefined,
      hp: mer.hp ?? undefined,
      description: mer.description ?? undefined,
      position1: mer.position1 ?? undefined,
      position2: mer.position2 ?? undefined,
      position3: mer.position3 ?? undefined,
      user: mer.user
        ? {
            name: mer.user.name,
            userImage: mer.user.userImage ?? undefined,
            email: mer.user.email ?? undefined,
          }
        : null,
      attendances: mer.attendances?.map((at) => ({
        matchClubId: at.matchClubId,
        isVote: at.isVote,
        isCheck: at.isCheck,
        matchClub: {
          match: { title: at.matchClub?.match?.title ?? "", stDate: at.matchClub?.match?.stDate },
        },
      })),
    }));
  }, [mercenaries]);

  type TableRow = (typeof tableData)[number];

  const columns = useMemo(() => mercenaryColumns<TableRow>({ isMobile }), [isMobile]);

  const handleSearch = (value: string) => {
    startTransition(() => {
      setGlobalFilter(value);
    });
  };

  const globalFilterFn = (row: Row<TableRow>, _columnId: string, filterValue: string) => {
    const name = row.original.name?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();
    const hp = row.original.hp?.toLowerCase() ?? "";
    const email = row.original.user?.email?.toLowerCase() ?? "";
    const convertHp = removePhoneHyphen(hp);
    const searchHp = removePhoneHyphen(search);

    return (
      Hangul.search(name, search) >= 0 || convertHp.includes(searchHp) || email.includes(search)
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="flex gap-x-2">
          <Input
            className="min-w-36"
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="검색"
          />
          <Button size={"icon"} onClick={() => handleSearch(globalFilter)}>
            <FaSearch />
          </Button>
          <SetMercenaryDialog
            onSubmit={async (values: MercenaryFormValues) => {
              const res = await createMercenary(values);
              return res.ok;
            }}
            title="용병 추가"
            description="회원 이메일로 검색하거나 임의로 추가할 수 있어요."
          >
            <Button size={"icon"}>
              <FaPlus />
            </Button>
          </SetMercenaryDialog>
        </div>
      </div>
      <DataTable
        data={tableData}
        columns={columns}
        options={{
          state: { globalFilter, sorting },
          onSortingChange: setSorting,
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          globalFilterFn,
        }}
      />
      {isLoading && <Loading />}
    </div>
  );
};

export default MercenaryPage;
