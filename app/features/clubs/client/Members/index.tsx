import type { Row, SortingState } from "@tanstack/react-table";
import { getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table";
import Hangul from "hangul-js";
import { useMemo, useState, useTransition } from "react";
import { FaSearch } from "react-icons/fa";
import DataTable from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getPlayerDisplayName } from "~/features/matches/isomorphic";
import type { IPlayer } from "../../isomorphic/types";
import { PlayersContext } from "./member.context";
import { memberColumns } from "./members.columns";

interface IMembersProps {
  players: IPlayer[];
  refetch: () => Promise<void> | void;
}
export const Members = ({ players, refetch }: IMembersProps) => {
  const [, startTransition] = useTransition();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const columns = useMemo(() => memberColumns, []);

  const globalFilterFn = (row: Row<IPlayer>, _columnId: string, filterValue: string) => {
    const name = getPlayerDisplayName(row.original).toLowerCase();
    const nick = (row.original.nick ?? row.original.user?.nick ?? "").toLowerCase();
    const email = row.original.user?.email?.toLowerCase() ?? "";
    const search = filterValue.toLowerCase();

    return (
      Hangul.search(name, search) >= 0 || Hangul.search(nick, search) >= 0 || email.includes(search)
    );
  };

  const handleSearch = (value: string) => {
    startTransition(() => {
      setGlobalFilter(value);
    });
  };

  return (
    <>
      <PlayersContext.Provider value={{ players, refetch }}>
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
          </div>
        </div>
        <DataTable
          data={players}
          columns={columns}
          options={{
            state: { globalFilter, sorting },
            onSortingChange: setSorting,
            getFilteredRowModel: getFilteredRowModel(),
            getSortedRowModel: getSortedRowModel(),
            globalFilterFn,
          }}
        />
      </PlayersContext.Provider>
    </>
  );
};
