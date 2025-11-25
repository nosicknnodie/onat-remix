-- Drop and recreate MatchClubStatsHistory as per new schema (period-based, id primary key)
DROP TABLE IF EXISTS "MatchClubStatsHistory";

-- Ensure StatsPeriodType enum exists for shadow DB runs
DO $$ BEGIN
  CREATE TYPE "StatsPeriodType" AS ENUM ('MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "MatchClubStatsHistory" (
    "id" TEXT NOT NULL,
    "matchClubId" TEXT NOT NULL,
    "periodType" "StatsPeriodType" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteCount" INTEGER,
    "voteRate" INTEGER,
    "checkCount" INTEGER,
    "checkRate" INTEGER,
    "matchCount" INTEGER,
    "playerTotalCount" INTEGER,
    CONSTRAINT "MatchClubStatsHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchClubStatsHistory_matchClubId_periodType_periodKey_key" ON "MatchClubStatsHistory"("matchClubId", "periodType", "periodKey");

ALTER TABLE "MatchClubStatsHistory"
  ADD CONSTRAINT "MatchClubStatsHistory_matchClubId_fkey"
  FOREIGN KEY ("matchClubId") REFERENCES "MatchClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
