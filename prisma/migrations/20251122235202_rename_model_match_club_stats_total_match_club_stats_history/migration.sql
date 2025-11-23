/*
  Warnings:

  - You are about to drop the `MatchClubTotal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MatchClubTotalHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MatchClubTotal" DROP CONSTRAINT "MatchClubTotal_matchClubId_fkey";

-- DropForeignKey
ALTER TABLE "MatchClubTotalHistory" DROP CONSTRAINT "MatchClubTotalHistory_matchClubId_fkey";

-- DropTable
DROP TABLE "MatchClubTotal";

-- DropTable
DROP TABLE "MatchClubTotalHistory";

-- CreateTable
CREATE TABLE "MatchClubStatsTotal" (
    "matchClubId" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "voteRate" INTEGER NOT NULL DEFAULT 0,
    "checkCount" INTEGER NOT NULL DEFAULT 0,
    "checkRate" INTEGER NOT NULL DEFAULT 0,
    "mercenaryVoteCount" INTEGER NOT NULL DEFAULT 0,
    "mercenaryCheckCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MatchClubStatsTotal_pkey" PRIMARY KEY ("matchClubId")
);

-- CreateTable
CREATE TABLE "MatchClubStatsHistory" (
    "matchClubId" TEXT NOT NULL,
    "monthlyVoteCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyVoteRate" INTEGER NOT NULL DEFAULT 0,
    "monthlyCheckCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyCheckRate" INTEGER NOT NULL DEFAULT 0,
    "quarterlyVoteCount" INTEGER NOT NULL DEFAULT 0,
    "quarterlyVoteRate" INTEGER NOT NULL DEFAULT 0,
    "quarterlyCheckCount" INTEGER NOT NULL DEFAULT 0,
    "quarterlyCheckRate" INTEGER NOT NULL DEFAULT 0,
    "halfYearVoteCount" INTEGER NOT NULL DEFAULT 0,
    "halfYearVoteRate" INTEGER NOT NULL DEFAULT 0,
    "halfYearCheckCount" INTEGER NOT NULL DEFAULT 0,
    "halfYearCheckRate" INTEGER NOT NULL DEFAULT 0,
    "yearVoteCount" INTEGER NOT NULL DEFAULT 0,
    "yearVoteRate" INTEGER NOT NULL DEFAULT 0,
    "yearCheckCount" INTEGER NOT NULL DEFAULT 0,
    "yearCheckRate" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MatchClubStatsHistory_pkey" PRIMARY KEY ("matchClubId")
);

-- AddForeignKey
ALTER TABLE "MatchClubStatsTotal" ADD CONSTRAINT "MatchClubStatsTotal_matchClubId_fkey" FOREIGN KEY ("matchClubId") REFERENCES "MatchClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchClubStatsHistory" ADD CONSTRAINT "MatchClubStatsHistory_matchClubId_fkey" FOREIGN KEY ("matchClubId") REFERENCES "MatchClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
