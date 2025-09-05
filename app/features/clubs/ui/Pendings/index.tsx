import DataTable from "~/components/DataTable";
import type { IPlayer } from "../../types";
import { pendingsColumns } from "./pendings.columns";
import { PendingsContext } from "./pendings.context";

interface IPendingsProps {
  players: IPlayer[];
  refetch: () => Promise<void> | void;
}

const Pendings = ({ players, refetch }: IPendingsProps) => {
  return (
    <>
      <PendingsContext.Provider value={{ players, refetch }}>
        <DataTable data={players} columns={pendingsColumns} />
      </PendingsContext.Provider>
    </>
  );
};

export default Pendings;
