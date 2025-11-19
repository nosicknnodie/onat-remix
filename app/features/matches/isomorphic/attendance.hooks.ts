import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { getJson, postJson, putJson } from "~/libs/api-client";
import type {
  AttendanceMutationInput,
  AttendanceMutationResponse,
  AttendanceQueryResponse,
  AttendanceStateMutationInput,
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
      );
    },
    enabled,
    initialData: options?.initialData,
  });
}

type UseAttendanceMutationOptions = {
  clubId?: string;
  onSuccess?: UseMutationOptions<
    AttendanceMutationResponse,
    unknown,
    AttendanceMutationInput
  >["onSuccess"];
  onError?: UseMutationOptions<
    AttendanceMutationResponse,
    unknown,
    AttendanceMutationInput
  >["onError"];
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
      return postJson<AttendanceMutationResponse>(`/api/matchClubs/${matchClubId}/attendance`, {
        ...input,
        clubId: options.clubId,
      });
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey });
      await options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options?.onError?.(error, variables, context);
    },
  });
}

export function useAttendanceStateMutation() {
  return useMutation<unknown, unknown, AttendanceStateMutationInput>({
    mutationFn: async (input) => {
      return putJson("/api/attendances", input);
    },
  });
}

type ToggleAttendanceStateInput = {
  id: string;
  isCheck: boolean;
};

export function useToggleAttendanceStateMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => (matchClubId ? attendanceQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, ToggleAttendanceStateInput>({
    mutationFn: async (input) => {
      return postJson("/api/attendances", input);
    },
    onSuccess: async () => {
      if (queryKey) await queryClient.invalidateQueries({ queryKey });
    },
  });
}

type TogglePlayerAttendanceInput = {
  matchClubId: string;
  playerId: string;
  isVote: boolean;
};

type ToggleMercenaryAttendanceInput = {
  matchClubId: string;
  mercenaryId: string;
  isVote: boolean;
};

export function useTogglePlayerAttendanceMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => (matchClubId ? attendanceQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<AttendanceMutationResponse, unknown, TogglePlayerAttendanceInput>({
    mutationFn: async (input) => {
      return postJson("/api/attendances/player", input);
    },
    onSuccess: async () => {
      if (queryKey) await queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useToggleMercenaryAttendanceMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => (matchClubId ? attendanceQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<AttendanceMutationResponse, unknown, ToggleMercenaryAttendanceInput>({
    mutationFn: async (input) => {
      return postJson("/api/attendances/mercenary", input);
    },
    onSuccess: async () => {
      if (queryKey) await queryClient.invalidateQueries({ queryKey });
    },
  });
}
