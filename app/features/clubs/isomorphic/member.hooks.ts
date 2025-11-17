import type { PlayerPermissionKey } from "@prisma/client";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type {
  ClubApprovedMembers,
  ClubPendingMembers,
  PlayerEffectivePermissions,
} from "./member.types";

export const clubMemberQueryKeys = {
  approved: (clubId: string) => ["club", clubId, "members", "approved"] as const,
  pendings: (clubId: string) => ["club", clubId, "members", "pendings"] as const,
  playerPermissions: (playerId: string) =>
    ["player", playerId, "permissions", "effective"] as const,
} as const;

type Options<TData> = Omit<
  UseQueryOptions<TData, unknown, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

function useClubMembersQuery<TData>(
  key: readonly unknown[],
  url: string,
  options?: Options<TData>,
) {
  const queryKey = useMemo(() => key, [key]);
  return useQuery<TData, unknown, TData, readonly unknown[]>({
    queryKey,
    queryFn: () => getJson<TData>(url),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useClubApprovedMembersQuery(
  clubId: string,
  options?: Options<ClubApprovedMembers>,
) {
  return useClubMembersQuery<ClubApprovedMembers>(
    clubMemberQueryKeys.approved(clubId),
    `/api/clubs/${clubId}/members/approved`,
    options,
  );
}

export function useClubPendingMembersQuery(clubId: string, options?: Options<ClubPendingMembers>) {
  return useClubMembersQuery<ClubPendingMembers>(
    clubMemberQueryKeys.pendings(clubId),
    `/api/clubs/${clubId}/members/pendings`,
    options,
  );
}

export function usePlayerPermissionsQuery(
  playerId: string,
  options?: Options<PlayerEffectivePermissions>,
) {
  return useClubMembersQuery<PlayerEffectivePermissions>(
    clubMemberQueryKeys.playerPermissions(playerId),
    `/api/players/${playerId}/permissions`,
    options,
  );
}

export function useHasPlayerPermission(
  playerId: string,
  permission: PlayerPermissionKey,
  options?: Options<PlayerEffectivePermissions>,
) {
  const query = usePlayerPermissionsQuery(playerId, options);
  const hasPermission = useMemo(
    () => query.data?.includes(permission) ?? false,
    [permission, query.data],
  );

  return { ...query, hasPermission };
}
