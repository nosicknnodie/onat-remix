import type { Player, PlayerPermission, PlayerPermissionKey, RoleType } from "@prisma/client";
import { prisma } from "~/libs/server/db/db";

/**
 * 템플릿(RoleType) 기반 기본 퍼미션 목록 조회
 */
export async function findTemplatePermissionsByRole(role: RoleType) {
  const rows = await prisma.playerRolePermissionTemplate.findMany({
    where: { role, allowed: true },
    select: {
      permission: true,
    },
  });

  return rows.map((row) => row.permission);
}

/**
 * 특정 플레이어의 퍼미션 오버라이드(sourceRole이 null인 것만) 조회
 */
export async function findPlayerPermissionOverrides(
  playerId: Player["id"],
): Promise<Pick<PlayerPermission, "permission" | "allowed">[]> {
  return prisma.playerPermission.findMany({
    where: {
      playerId,
      sourceRole: null,
    },
    select: {
      permission: true,
      allowed: true,
    },
  });
}

/**
 * 효과적인 퍼미션 목록을 계산하기 위한 재료를 한번에 가져오는 헬퍼
 */
export async function fetchPermissionMaterial(player: Pick<Player, "id" | "role">) {
  const [templatePermissions, overrides] = await Promise.all([
    findTemplatePermissionsByRole(player.role),
    findPlayerPermissionOverrides(player.id),
  ]);

  return {
    templatePermissions,
    overrides,
  };
}

/**
 * 템플릿 + 오버라이드를 병합하여 실제 적용 퍼미션 키 배열을 반환
 * - 템플릿을 기본값으로 사용
 * - 오버라이드가 있는 경우 템플릿 값을 덮어쓴다(allowed=true 추가, allowed=false 제거)
 */
export async function getEffectivePermissions(
  player: Pick<Player, "id" | "role">,
): Promise<PlayerPermissionKey[]> {
  const { templatePermissions, overrides } = await fetchPermissionMaterial(player);

  const allowed = new Set<PlayerPermissionKey>(templatePermissions);

  for (const { permission, allowed: isAllowed } of overrides) {
    if (isAllowed) {
      allowed.add(permission);
    } else {
      allowed.delete(permission);
    }
  }

  return Array.from(allowed);
}
