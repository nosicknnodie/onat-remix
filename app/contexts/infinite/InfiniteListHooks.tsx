import { useContext } from "react";
import { InfiniteListCtx } from "./InfiniteListContext";
import { Ctx } from "./types";

export function useInfiniteList<T>() {
  const ctx = useContext(InfiniteListCtx) as Ctx<T> | null;
  if (!ctx)
    throw new Error("useInfiniteList must be used within InfiniteListProvider");
  return ctx;
}
