-- DropIndex
DROP INDEX "MatchClub_legacyId_key";

-- DropIndex
DROP INDEX "Player_legacyId_key";

-- DropIndex
DROP INDEX "users_legacyId_key";

-- AlterTable
ALTER TABLE "MatchClub" ALTER COLUMN "legacyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "legacyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "legacyEmail" DROP NOT NULL,
ALTER COLUMN "legacyId" DROP NOT NULL;
