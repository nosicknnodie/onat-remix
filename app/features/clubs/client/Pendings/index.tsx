import DataTable from "~/components/DataTable";
import type { IPlayer } from "../../isomorphic/types";
import { pendingsColumns } from "./pendings.columns";
import { PendingsContext } from "./pendings.context";

interface IPendingsProps {
  players: IPlayer[];
  refetch: () => Promise<void> | void;
}

export const Pendings = ({ players, refetch }: IPendingsProps) => {
  return (
    <>
      <PendingsContext.Provider value={{ players, refetch }}>
        <DataTable data={players} columns={pendingsColumns} />
      </PendingsContext.Provider>
    </>
  );
};
