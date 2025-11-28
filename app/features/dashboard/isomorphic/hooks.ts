import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/client/api-client";
import type {
  DashboardMatchInsight,
  DashboardMom,
  DashboardPerformanceHistory,
  DashboardPost,
} from "./types";

export const dashboardQueryKeys = {
  todayMatches: ["dashboard", "today-matches"] as const,
  upcomingAttendances: ["dashboard", "upcoming-attendances"] as const,
  highlightPosts: ["dashboard", "highlight-posts"] as const,
  weeklyMoms: ["dashboard", "weekly-moms"] as const,
  performanceHistory: (year?: string) => ["dashboard", "performance-history", year] as const,
};

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useDashboardQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url),
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

export function usePerformanceHistoryQuery(
  year?: string,
  options?: Options<DashboardPerformanceHistory>,
) {
  const params = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (year) searchParams.set("year", year);
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }, [year]);

  return useDashboardQuery<DashboardPerformanceHistory>(
    dashboardQueryKeys.performanceHistory(year),
    `/api/dashboard/performance-history${params}`,
    { placeholderData: (prev) => prev, ...options },
  );
}
