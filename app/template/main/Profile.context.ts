import type { Profile } from "@prisma/client";
import { createContext } from "react";

export const ProfileContext = createContext<Profile | null>(null);
