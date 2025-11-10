import { createContext, useContext } from "react";
import type { IPlayer } from "../../isomorphic/types";

export const PlayersContext = createContext<
  ({ players: IPlayer[] } & { refetch: () => Promise<void> | void }) | undefined
>(undefined);

export const useGetPlayers = () => {
  return useContext(PlayersContext);
};
