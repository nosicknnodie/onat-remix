/*
  Warnings:

  - You are about to drop the `AttendanceStatsHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'OWN_GOAL', 'PK_GOAL', 'ASSIST', 'SHOT', 'CARD', 'FOUL', 'SUB');

-- DropForeignKey
ALTER TABLE "AttendanceStatsHistory" DROP CONSTRAINT "AttendanceStatsHistory_attendanceId_fkey";

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "eventType" "MatchEventType" NOT NULL DEFAULT 'GOAL',
ADD COLUMN     "matchClubId" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "value" INTEGER;

-- DropTable
DROP TABLE "AttendanceStatsHistory";

-- CreateTable
CREATE TABLE "PlayerStatsHistory" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "periodType" "StatsPeriodType" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "averageRating" INTEGER,
    "totalRating" INTEGER,
    "totalGoal" INTEGER,
    "totalAssist" INTEGER,
    "totalLike" INTEGER,
    "matchCount" INTEGER,

    CONSTRAINT "PlayerStatsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerStatsHistory_playerId_idx" ON "PlayerStatsHistory"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStatsHistory_playerId_periodType_periodKey_key" ON "PlayerStatsHistory"("playerId", "periodType", "periodKey");

-- CreateIndex
CREATE INDEX "Record_matchClubId_eventType_idx" ON "Record"("matchClubId", "eventType");

-- AddForeignKey
ALTER TABLE "PlayerStatsHistory" ADD CONSTRAINT "PlayerStatsHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_matchClubId_fkey" FOREIGN KEY ("matchClubId") REFERENCES "MatchClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
