import { PrismaClient, PlayerPermissionKey, RoleType } from "@prisma/client";

const prisma = new PrismaClient();

const ROLE_HIERARCHY: RoleType[] = [
  RoleType.PENDING,
  RoleType.NORMAL,
  RoleType.MANAGER,
  RoleType.MASTER,
];

const atLeast = (role: RoleType) =>
  ROLE_HIERARCHY.slice(ROLE_HIERARCHY.indexOf(role));

const only = (role: RoleType) => [role];

const permissionMatrix: Array<{
  permission: PlayerPermissionKey;
  roles: RoleType[];
}> = [
  { permission: PlayerPermissionKey.CLUB_VIEW, roles: atLeast(RoleType.NORMAL) },
  { permission: PlayerPermissionKey.CLUB_MANAGE, roles: atLeast(RoleType.MASTER) },
  {
    permission: PlayerPermissionKey.PLAYER_MANAGE,
    roles: atLeast(RoleType.MANAGER),
  },
  {
    permission: PlayerPermissionKey.PLAYER_ASSIGN_MANAGER,
    roles: atLeast(RoleType.MASTER),
  },
  {
    permission: PlayerPermissionKey.PLAYER_APPROVE_MEMBER,
    roles: atLeast(RoleType.MANAGER),
  },
  { permission: PlayerPermissionKey.PLAYER_VIEW, roles: atLeast(RoleType.NORMAL) },
  {
    permission: PlayerPermissionKey.MATCH_CREATE,
    roles: atLeast(RoleType.MANAGER),
  },
  {
    permission: PlayerPermissionKey.MATCH_MANAGE,
    roles: atLeast(RoleType.MANAGER),
  },
  {
    permission: PlayerPermissionKey.MATCH_MASTER,
    roles: atLeast(RoleType.MASTER),
  },
  {
    permission: PlayerPermissionKey.MATCH_VIEW,
    roles: atLeast(RoleType.NORMAL),
  },
  {
    permission: PlayerPermissionKey.MERCENARY_MANAGE,
    roles: atLeast(RoleType.MANAGER),
  },
  {
    permission: PlayerPermissionKey.BOARD_MASTER,
    roles: atLeast(RoleType.MASTER),
  },
  {
    permission: PlayerPermissionKey.BOARD_MANAGER,
    roles: atLeast(RoleType.MANAGER),
  },
  {
    permission: PlayerPermissionKey.BOARD_NORMAL,
    roles: atLeast(RoleType.NORMAL),
  },
  {
    permission: PlayerPermissionKey.BOARD_PENDING,
    roles: only(RoleType.PENDING),
  },
  {
    permission: PlayerPermissionKey.EVALUATION_VIEW,
    roles: atLeast(RoleType.NORMAL),
  },
];

async function main() {
  for (const { permission, roles } of permissionMatrix) {
    for (const role of roles) {
      await prisma.playerRolePermissionTemplate.upsert({
        where: {
          role_permission: {
            role,
            permission,
          },
        },
        update: {
          allowed: true,
        },
        create: {
          role,
          permission,
          allowed: true,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to seed PlayerRolePermissionTemplate:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
