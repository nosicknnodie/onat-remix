import { useQuery } from "@tanstack/react-query";
import type { ClubYearStatsResponse, WeeklyTopRatingResponse } from "./stats.types";

export function useClubYearStats(clubId: string | undefined, year: number) {
  return useQuery<ClubYearStatsResponse>({
    queryKey: ["club-year-stats", clubId, year],
    enabled: Boolean(clubId),
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/stats/main?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch club year stats");
      return (await res.json()) as ClubYearStatsResponse;
    },
  });
}

export function useWeeklyTopRating(clubId: string | undefined) {
  return useQuery<WeeklyTopRatingResponse>({
    queryKey: ["club-weekly-top-rating", clubId],
    enabled: Boolean(clubId),
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/stats/weekly-top`);
      if (!res.ok) throw new Error("Failed to fetch weekly top rating");
      return (await res.json()) as WeeklyTopRatingResponse;
    },
    initialData: [],
  });
}
