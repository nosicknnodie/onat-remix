import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type { ClubApprovedMembers, ClubPendingMembers } from "./member.types";

export const clubMemberQueryKeys = {
  approved: (clubId: string) => ["club", clubId, "members", "approved"] as const,
  pendings: (clubId: string) => ["club", clubId, "members", "pendings"] as const,
} as const;

type Options<TData> = Omit<
  UseQueryOptions<TData, unknown, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

function useClubMembersQuery<TData>(key: readonly unknown[], url: string, options?: Options<TData>) {
  const queryKey = useMemo(() => key, [key]);
  return useQuery<TData, unknown, TData, readonly unknown[]>({
    queryKey,
    queryFn: () => getJson<TData>(url, { auth: true }),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useClubApprovedMembersQuery(clubId: string, options?: Options<ClubApprovedMembers>) {
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
