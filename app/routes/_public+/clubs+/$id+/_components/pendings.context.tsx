import { createContext, useContext } from "react";
import type { IPendingsPageLoaderData } from "../pendings";

export const PendingsContext = createContext<
  (IPendingsPageLoaderData & { refetch: () => Promise<void> }) | undefined
>(undefined);

export const useGetPendingPlayers = () => {
  return useContext(PendingsContext);
};
