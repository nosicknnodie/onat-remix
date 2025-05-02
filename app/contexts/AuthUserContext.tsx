import type { Profile } from "@prisma/client";
import type { User } from "lucia";
import { createContext, useContext } from "react";

export const UserContext = createContext<User | null>(null);
export const useSession = () => useContext(UserContext);
export const ProfileContext = createContext<Profile | null>(null);
export const useProfileUser = () => useContext(ProfileContext);
