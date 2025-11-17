import type { Player, PlayerPermissionKey, RoleType } from "@prisma/client";
import * as queries from "./member.queries";

/**
 * 플레이어의 효과적인 퍼미션 목록을 반환
 */
export async function getEffectivePermissions(player: Pick<Player, "id" | "role">) {
  return queries.getEffectivePermissions(player);
}

/**
 * 특정 퍼미션이 허용되는지 체크하는 헬퍼
 */
export async function hasPermission(
  player: Pick<Player, "id" | "role">,
  permission: PlayerPermissionKey,
): Promise<boolean> {
  const effective = await queries.getEffectivePermissions(player);
  return effective.includes(permission);
}

/**
 * 특정 롤(RoleType)을 템플릿으로 사용할 때 기본 퍼미션 목록을 조회
 */
export async function getTemplatePermissions(role: RoleType) {
  return queries.findTemplatePermissionsByRole(role);
}
