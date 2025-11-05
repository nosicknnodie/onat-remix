import { type LoaderFunctionArgs, redirect, type TypedResponse } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Row, SortingState } from "@tanstack/react-table";
import Hangul from "hangul-js";
import { useState, useTransition } from "react";
import { MercenariesTable, mercenaryColumns } from "~/features/matches";
import { mercenaries as matches } from "~/features/matches/index.server";
import { removePhoneHyphen } from "~/libs/convert";

export async function loader({ params }: LoaderFunctionArgs) {
  const clubId = params.clubId;
  const matchClubId = params.matchClubId;
  if (!clubId || !matchClubId) return redirect("/clubs");
  const data = await matches.service.getMercenaries(clubId, matchClubId);
  if ("redirectTo" in data) return redirect(data.redirectTo as string);
  return data;
}

export type IMatchClubMecenaryLoaderTData = Exclude<
  Awaited<ReturnType<typeof loader>>,
  TypedResponse<unknown>
>["mercenaries"];
interface IMatchClubMecenaryPageProps {}

const MatchClubMecenaryPage = (_props: IMatchClubMecenaryPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const [, startTransition] = useTransition();
  const mercenaries = loaderData.mercenaries;
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

  // global filter
  const globalFilterFn = (
    row: Row<IMatchClubMecenaryLoaderTData[number]>,
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
      Hangul.search(name, search) >= 0 || convertHp.includes(searchHp) || email.includes(search)
    );
  };

  const columns = mercenaryColumns<IMatchClubMecenaryLoaderTData[number]>();
  return (
    <div className="space-y-2">
      <MercenariesTable
        data={mercenaries}
        columns={columns}
        newPath="./new"
        globalFilter={globalFilter}
        onGlobalFilterChange={handleSearch}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilterFn={globalFilterFn}
      />
    </div>
  );
};

export default MatchClubMecenaryPage;
