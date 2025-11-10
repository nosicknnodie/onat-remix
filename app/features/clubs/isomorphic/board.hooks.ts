import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { ClubBoardTabs, ClubInfoData } from "./types";

export const clubBoardQueryKeys = {
  tabs: (clubId: string) => ["club", clubId, "board", "tabs"] as const,
} as const;

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useClubBoardQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url, { auth: true }),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useClubBoardsTabsQuery(clubId: string, options?: Options<ClubBoardTabs>) {
  return useClubBoardQuery<ClubBoardTabs>(
    clubBoardQueryKeys.tabs(clubId),
    `/api/clubs/${clubId}/boards/tabs`,
    options,
  );
}
