import { Club } from "@prisma/client";
import { useMemo } from "react";
import DataTable from "~/components/DataTable";
import { PlayersContext, usePlayersQuery } from "./member.context";
import { memberColumns } from "./members.columns";

interface IMembersTableProps {
  club: Club;
}

const MembersTable = ({ club }: IMembersTableProps) => {
  const query = usePlayersQuery({ club });
  const players = useMemo(
    () => query.data?.players || [],
    [query.data?.players]
  );
  return (
    <>
      <PlayersContext.Provider value={query}>
        <DataTable data={players} columns={memberColumns} />
      </PlayersContext.Provider>
    </>
  );
};

export default MembersTable;
