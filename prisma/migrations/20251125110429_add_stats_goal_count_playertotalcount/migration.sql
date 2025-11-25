-- AlterTable
ALTER TABLE "AttendanceStatsHistory" ADD COLUMN     "halfYearTotalGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyTotalGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quarterlyTotalGoal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yearlyTotalGoal" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MatchClubStatsHistory" ADD COLUMN     "playerTotalCount" INTEGER NOT NULL DEFAULT 0;
