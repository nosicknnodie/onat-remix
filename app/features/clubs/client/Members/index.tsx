import DataTable from "~/components/DataTable";
import type { IPlayer } from "../../isomorphic/types";
import { PlayersContext } from "./member.context";
import { memberColumns } from "./members.columns";

interface IMembersProps {
  players: IPlayer[];
  refetch: () => Promise<void> | void;
}
export const Members = ({ players, refetch }: IMembersProps) => {
  return (
    <>
      <PlayersContext.Provider value={{ players, refetch }}>
        <DataTable data={players} columns={memberColumns} />
      </PlayersContext.Provider>
    </>
  );
};
