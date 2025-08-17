import { createContext, useContext } from "react";
import type { IMembersPageLoaderData } from "../members";

export const PlayersContext = createContext<
  (IMembersPageLoaderData & { refetch: () => Promise<void> }) | undefined
>(undefined);

export const useGetPlayers = () => {
  return useContext(PlayersContext);
};
