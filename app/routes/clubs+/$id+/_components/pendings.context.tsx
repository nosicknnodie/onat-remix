import { createContext, useContext } from "react";
import { IPendingsPageLoaderData } from "../pendings";

export const PendingsContext = createContext<
  (IPendingsPageLoaderData & { refetch: () => Promise<void> }) | undefined
>(undefined);

export const useGetPlayers = () => {
  return useContext(PendingsContext);
};
