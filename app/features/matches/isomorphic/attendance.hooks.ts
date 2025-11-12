import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson } from "~/libs/api-client";
import type {
  AttendanceMutationInput,
  AttendanceMutationResponse,
  AttendanceQueryResponse,
} from "./attnedance.types";

export const attendanceQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "attendance"] as const,
} as const;

type UseAttendanceQueryOptions = {
  enabled?: boolean;
  clubId?: string;
  initialData?: AttendanceQueryResponse;
};

export function useAttendanceQuery(matchClubId?: string, options?: UseAttendanceQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const clubId = options?.clubId;
  const queryKey = useMemo(() => attendanceQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<AttendanceQueryResponse>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch attendance");
      }
      if (!clubId) {
        throw new Error("clubId is required to fetch attendance");
      }
      const searchParams = new URLSearchParams({ clubId });
      return getJson<AttendanceQueryResponse>(
        `/api/matchClubs/${matchClubId}/attendance?${searchParams.toString()}`,
        { auth: true },
      );
    },
    enabled,
    initialData: options?.initialData,
  });
}

type UseAttendanceMutationOptions = {
  clubId?: string;
};

export function useAttendanceMutation(
  matchClubId?: string,
  options?: UseAttendanceMutationOptions,
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => attendanceQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useMutation<AttendanceMutationResponse, unknown, AttendanceMutationInput>({
    mutationFn: async (input) => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to submit attendance");
      }
      if (!options?.clubId) {
        throw new Error("clubId is required to submit attendance");
      }
      const res = await fetch(`/api/matchClubs/${matchClubId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, clubId: options.clubId }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to submit attendance");
      }
      return (await res.json()) as AttendanceMutationResponse;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
