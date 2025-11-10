import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ClubInfoData } from "./types";
import { getJson } from "~/libs/api-client";

export const clubInfoQueryKeys = {
  base: (clubId: string) => ["club", clubId, "info"] as const,
  recentMatch: (clubId: string) => ["club", clubId, "info", "recent-match"] as const,
  upcomingMatch: (clubId: string) => ["club", clubId, "info", "upcoming-match"] as const,
  attendance: (clubId: string) => ["club", clubId, "info", "attendance"] as const,
  goalLeaders: (clubId: string) => ["club", clubId, "info", "goal-leaders"] as const,
  ratingLeaders: (clubId: string) => ["club", clubId, "info", "rating-leaders"] as const,
  notices: (clubId: string) => ["club", clubId, "info", "notices"] as const,
} as const;

type Options<TData> = Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;

function useClubInfoQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const mergedKey = useMemo(() => key, [key]);
  return useQuery<TData>({
    queryKey: mergedKey,
    queryFn: () => getJson<TData>(url, { auth: true }),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useRecentMatchQuery(clubId: string, options?: Options<ClubInfoData["recentMatch"]>) {
  return useClubInfoQuery<ClubInfoData["recentMatch"]>(
    clubInfoQueryKeys.recentMatch(clubId),
    `/api/clubs/${clubId}/info/recent-match`,
    options,
  );
}

export function useUpcomingMatchQuery(
  clubId: string,
  options?: Options<ClubInfoData["upcomingMatch"]>,
) {
  return useClubInfoQuery<ClubInfoData["upcomingMatch"]>(
    clubInfoQueryKeys.upcomingMatch(clubId),
    `/api/clubs/${clubId}/info/upcoming-match`,
    options,
  );
}

export function useAttendanceQuery(clubId: string, options?: Options<ClubInfoData["attendance"]>) {
  return useClubInfoQuery<ClubInfoData["attendance"]>(
    clubInfoQueryKeys.attendance(clubId),
    `/api/clubs/${clubId}/info/attendance`,
    options,
  );
}

export function useGoalLeadersQuery(
  clubId: string,
  options?: Options<ClubInfoData["goalLeaders"]>,
) {
  return useClubInfoQuery<ClubInfoData["goalLeaders"]>(
    clubInfoQueryKeys.goalLeaders(clubId),
    `/api/clubs/${clubId}/info/goal-leaders`,
    options,
  );
}

export function useRatingLeadersQuery(
  clubId: string,
  options?: Options<ClubInfoData["ratingLeaders"]>,
) {
  return useClubInfoQuery<ClubInfoData["ratingLeaders"]>(
    clubInfoQueryKeys.ratingLeaders(clubId),
    `/api/clubs/${clubId}/info/rating-leaders`,
    options,
  );
}

export function useNoticesQuery(
  clubId: string,
  take?: number,
  options?: Options<ClubInfoData["notices"]>,
) {
  const queryUrl = useMemo(() => {
    const base = `/api/clubs/${clubId}/info/notices`;
    if (!take) return base;
    const params = new URLSearchParams({ take: String(take) });
    return `${base}?${params.toString()}`;
  }, [clubId, take]);

  return useClubInfoQuery<ClubInfoData["notices"]>(
    clubInfoQueryKeys.notices(clubId),
    queryUrl,
    options,
  );
}
