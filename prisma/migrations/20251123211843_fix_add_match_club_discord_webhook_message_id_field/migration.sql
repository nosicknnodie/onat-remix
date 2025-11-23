/*
  Warnings:

  - You are about to drop the column `discordWebhookMessageId` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "discordWebhookMessageId";

-- AlterTable
ALTER TABLE "MatchClub" ADD COLUMN     "discordWebhookMessageId" TEXT;
