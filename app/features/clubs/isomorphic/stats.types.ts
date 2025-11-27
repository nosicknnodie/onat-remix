export type ClubYearStatItem = {
  playerId: string;
  nick: string | null;
  userImageUrl: string | null;
  averageRating: number;
  totalGoal: number;
  totalLike: number;
  totalRating: number;
};
export interface ClubYearMainStatsItem extends ClubYearStatItem {
  matchCount: number;
  attendanceRate: number;
}

export type ClubYearStatsResponse = ClubYearStatItem[];
export type ClubYearMainStatsResponse = ClubYearMainStatsItem[];
export type WeeklyTopRatingItem = {
  playerId: string;
  matchClubId: string | null;
  matchDate: string | null;
  nick: string | null;
  userImageUrl: string | null;
  averageRating: number;
};

export type WeeklyTopRatingResponse = WeeklyTopRatingItem[];
