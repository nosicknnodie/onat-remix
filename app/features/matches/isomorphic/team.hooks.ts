import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson } from "~/libs/api-client";
import { attendanceQueryKeys } from "./attendance.hooks";
import type { TeamQueryResponse } from "./team.types";

export const teamQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "teams"] as const,
} as const;

type UseTeamQueryOptions = {
  enabled?: boolean;
  clubId?: string;
  initialData?: TeamQueryResponse;
};

export function useTeamQuery(matchClubId?: string, options?: UseTeamQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => teamQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<TeamQueryResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch teams");
      }
      if (!options?.clubId) {
        throw new Error("clubId is required to fetch teams");
      }
      const searchParams = new URLSearchParams({ clubId: options.clubId });
      return getJson<TeamQueryResponse>(
        `/api/matchClubs/${matchClubId}/teams?${searchParams.toString()}`,
        { auth: true },
      );
    },
    enabled,
    initialData: options?.initialData,
  });
}

type TeamAssignmentInput = {
  teamId: string;
  attendanceIds: string[];
};

export function useTeamAssignmentMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const teamQueryKey = useMemo(
    () => (matchClubId ? teamQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  const attendanceQueryKey = useMemo(
    () => (matchClubId ? attendanceQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );

  return useMutation<unknown, unknown, TeamAssignmentInput>({
    mutationFn: async (input) => {
      return postJson("/api/attendances/team", input, { auth: true });
    },
    onSuccess: async () => {
      if (teamQueryKey) {
        await queryClient.invalidateQueries({ queryKey: teamQueryKey });
      }
      if (attendanceQueryKey) {
        await queryClient.invalidateQueries({ queryKey: attendanceQueryKey });
      }
    },
  });
}

type TeamUpdateInput = {
  teamId: string;
  name: string;
  color: string;
  seq?: number;
};

export function useTeamUpdateMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const teamQueryKey = useMemo(
    () => (matchClubId ? teamQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );

  return useMutation<unknown, unknown, TeamUpdateInput>({
    mutationFn: async ({ teamId, ...data }) => {
      return postJson(`/api/teams/${teamId}`, data, { auth: true });
    },
    onSuccess: async () => {
      if (teamQueryKey) {
        await queryClient.invalidateQueries({ queryKey: teamQueryKey });
      }
    },
  });
}
