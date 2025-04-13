import { Profile } from "@prisma/client";
import { User } from "lucia";
import { createContext, useContext } from "react";

export const UserContext = createContext<User | null>(null);
export const useAuthUser = () => useContext(UserContext);
export const ProfileContext = createContext<Profile | null>(null);
export const useProfileUser = () => useContext(ProfileContext);
