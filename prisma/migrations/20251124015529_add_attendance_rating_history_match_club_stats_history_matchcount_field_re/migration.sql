-- AlterTable
ALTER TABLE "AttendanceRatingHistory" ADD COLUMN     "halfYearMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quarterlyMatchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yearlyMatchCount" INTEGER NOT NULL DEFAULT 0;
