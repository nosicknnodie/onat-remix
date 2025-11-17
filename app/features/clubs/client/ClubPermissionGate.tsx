import type { PlayerPermissionKey } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQueryClient } from "@tanstack/react-query";
import { clubInfoQueryKeys, usePlayerPermissionsQuery } from "~/features/clubs/isomorphic";

interface ClubPermissionGateProps extends React.PropsWithChildren {
  clubId?: string;
  permission: PlayerPermissionKey;
}

/**
 * 현재 클럽(또는 지정한 클럽)의 멤버 퍼미션을 조회해 통과 시 children을 렌더링합니다.
 * - clubId prop이 없으면 route params의 clubId를 사용합니다.
 * - 클럽 멤버십이 없거나 퍼미션 검사 중이면 null을 반환합니다.
 */
export function ClubPermissionGate({
  clubId: clubIdProp,
  permission,
  children,
}: ClubPermissionGateProps) {
  const params = useParams();
  const clubId = clubIdProp ?? params.clubId ?? params.id ?? null;
  const queryClient = useQueryClient();

  const membership = clubId
    ? queryClient.getQueryData<{ id: string } | null>(clubInfoQueryKeys.membership(clubId))
    : null;

  const permissionsQuery = usePlayerPermissionsQuery(membership?.id ?? "", {
    enabled: Boolean(membership?.id),
    staleTime: 1000 * 60 * 5,
  });

  if (!clubId || !membership?.id) return null;
  if (permissionsQuery.isLoading || permissionsQuery.isFetching || permissionsQuery.isError) {
    return null;
  }

  const permissionList = Array.isArray(permissionsQuery.data) ? permissionsQuery.data : [];

  const hasPermission = permissionList.includes(permission);
  if (!hasPermission) return null;

  return <>{children && children}</>;
}
