/*
  Warnings:

  - A unique constraint covering the columns `[legacyId]` on the table `MatchClub` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[legacyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `legacyId` to the `MatchClub` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacyId` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacyEmail` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacyId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MatchClub" ADD COLUMN     "legacyId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "legacyId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "legacyEmail" TEXT NOT NULL,
ADD COLUMN     "legacyId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MatchClub_legacyId_key" ON "MatchClub"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_legacyId_key" ON "Player"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_legacyId_key" ON "users"("legacyId");
