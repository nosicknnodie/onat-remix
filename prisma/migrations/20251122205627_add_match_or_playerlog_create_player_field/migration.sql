-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "createPlayerId" TEXT;

-- AlterTable
ALTER TABLE "PlayerLog" ADD COLUMN     "createPlayerId" TEXT;

-- CreateIndex
CREATE INDEX "PlayerLog_createPlayerId_idx" ON "PlayerLog"("createPlayerId");

-- AddForeignKey
ALTER TABLE "PlayerLog" ADD CONSTRAINT "PlayerLog_createPlayerId_fkey" FOREIGN KEY ("createPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createPlayerId_fkey" FOREIGN KEY ("createPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
