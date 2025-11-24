-- AlterTable
ALTER TABLE "MatchClubStatsHistory" ADD COLUMN     "halfYearMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quarterlyMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yearMatchCount" INTEGER NOT NULL DEFAULT 0;
