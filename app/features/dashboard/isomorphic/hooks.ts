import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { DashboardMatchInsight, DashboardMom, DashboardPost } from "./types";

export const dashboardQueryKeys = {
  todayMatches: ["dashboard", "today-matches"] as const,
  upcomingAttendances: ["dashboard", "upcoming-attendances"] as const,
  highlightPosts: ["dashboard", "highlight-posts"] as const,
  weeklyMoms: ["dashboard", "weekly-moms"] as const,
};

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useDashboardQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url, { auth: true }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useTodayMatchesQuery(options?: Options<DashboardMatchInsight[]>) {
  return useDashboardQuery<DashboardMatchInsight[]>(
    dashboardQueryKeys.todayMatches,
    "/api/dashboard/today-matches",
    options,
  );
}

export function useUpcomingAttendancesQuery(options?: Options<DashboardMatchInsight[]>) {
  return useDashboardQuery<DashboardMatchInsight[]>(
    dashboardQueryKeys.upcomingAttendances,
    "/api/dashboard/upcoming-attendances",
    options,
  );
}

export function useHighlightPostsQuery(options?: Options<DashboardPost[]>) {
  return useDashboardQuery<DashboardPost[]>(
    dashboardQueryKeys.highlightPosts,
    "/api/dashboard/highlight-posts",
    options,
  );
}

export function useWeeklyMomsQuery(options?: Options<DashboardMom[]>) {
  return useDashboardQuery<DashboardMom[]>(
    dashboardQueryKeys.weeklyMoms,
    "/api/dashboard/weekly-moms",
    options,
  );
}
