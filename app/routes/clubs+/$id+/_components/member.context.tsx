import { createContext, useContext } from "react";
import { IMembersPageLoaderData } from "../members";

export const PlayersContext = createContext<
  (IMembersPageLoaderData & { refetch: () => Promise<void> }) | undefined
>(undefined);

export const useGetPlayers = () => {
  return useContext(PlayersContext);
};
