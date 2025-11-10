import { createContext, useContext } from "react";
import type { IPlayer } from "../../isomorphic/types";

export const PendingsContext = createContext<
  ({ players: IPlayer[] } & { refetch: () => Promise<void> | void }) | undefined
>(undefined);

export const useGetPendingPlayers = () => {
  return useContext(PendingsContext);
};
