import type { User } from "lucia";
import { createContext, useContext } from "react";

/**
 * Authenticated user context shared across the app.
 * - undefined: not initialized yet
 * - null: no active session
 * - User: authenticated user
 */
export const UserContext = createContext<User | null | undefined>(undefined);

/**
 * Hook to access the current authenticated user session.
 * Returns `undefined` during initial render, `null` if signed out, or `User` when signed in.
 */
export const useSession = () => useContext(UserContext);
