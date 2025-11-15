-- CreateEnum
CREATE TYPE "PlayerPermissionKey" AS ENUM ('CLUB_VIEW', 'CLUB_MANAGE', 'PLAYER_MANAGE', 'PLAYER_ASSIGN_MANAGER', 'PLAYER_APPROVE_MEMBER', 'PLAYER_VIEW', 'MATCH_CREATE', 'MATCH_MANAGE', 'MERCENARY_MANAGE', 'BOARD_MASTER', 'BOARD_MANAGER', 'BOARD_NORMAL', 'BOARD_PENDING', 'EVALUATION_VIEW');

-- CreateEnum
CREATE TYPE "BoardPermissionAction" AS ENUM ('READ', 'WRITE', 'MANAGE');

-- CreateTable
CREATE TABLE "PlayerRolePermissionTemplate" (
    "id" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "permission" "PlayerPermissionKey" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerRolePermissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPermission" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "permission" "PlayerPermissionKey" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "sourceRole" "RoleType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPermission" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "action" "BoardPermissionAction" NOT NULL,
    "permission" "PlayerPermissionKey" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRolePermissionTemplate_role_permission_key" ON "PlayerRolePermissionTemplate"("role", "permission");

-- CreateIndex
CREATE INDEX "PlayerPermission_playerId_idx" ON "PlayerPermission"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPermission_playerId_permission_key" ON "PlayerPermission"("playerId", "permission");

-- CreateIndex
CREATE INDEX "BoardPermission_boardId_idx" ON "BoardPermission"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardPermission_boardId_action_permission_key" ON "BoardPermission"("boardId", "action", "permission");

-- AddForeignKey
ALTER TABLE "PlayerPermission" ADD CONSTRAINT "PlayerPermission_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPermission" ADD CONSTRAINT "BoardPermission_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
