-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "replyToPlayerId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_playerId_idx" ON "Comment"("playerId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_replyToPlayerId_fkey" FOREIGN KEY ("replyToPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
