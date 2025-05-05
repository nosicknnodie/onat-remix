import { User } from "lucia";
import { createContext, useContext } from "react";

export const UserContext = createContext<User | null>(null);
export const useSession = () => useContext(UserContext);
