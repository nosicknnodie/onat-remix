import type { User } from "lucia";
import { createContext, useContext } from "react";

export const UserContext = createContext<User | null | undefined>(undefined);
export const useSession = () => useContext(UserContext);
