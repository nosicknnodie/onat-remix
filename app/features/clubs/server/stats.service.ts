import { getClubYearStats, getWeeklyTopRating } from "./stats.queries";

export async function getClubYearStatsService(params: { clubId: string; year: number }) {
  return await getClubYearStats(params);
}

export async function getWeeklyTopRatingService(clubId: string) {
  return await getWeeklyTopRating(clubId);
}
