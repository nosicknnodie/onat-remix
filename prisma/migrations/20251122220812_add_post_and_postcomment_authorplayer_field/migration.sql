-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorPlayerId" TEXT;

-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN     "authorPlayerId" TEXT;

-- CreateIndex
CREATE INDEX "Post_authorPlayerId_idx" ON "Post"("authorPlayerId");

-- CreateIndex
CREATE INDEX "PostComment_authorPlayerId_idx" ON "PostComment"("authorPlayerId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorPlayerId_fkey" FOREIGN KEY ("authorPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorPlayerId_fkey" FOREIGN KEY ("authorPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
