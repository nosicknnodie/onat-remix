import type { AttendanceState } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo } from "react";
import { BrowserStableWebSocket } from "~/libs";
import { del, getJson, postJson, putJson } from "~/libs/api-client";
import type { POSITION_TYPE } from "~/libs/const/position.const";
import type {
  PositionAttendance,
  PositionContextValue,
  PositionQuarterData,
  PositionQueryData,
  PositionSettingContextValue,
  PositionSettingMatchClubData,
  PositionSettingQueryData,
} from "./position.types";

export const positionQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "position", "attendances"] as const,
  quarters: (matchClubId: string) => ["matchClub", matchClubId, "position", "quarters"] as const,
  settingAttendances: (matchClubId: string) =>
    ["matchClub", matchClubId, "position", "setting", "attendances"] as const,
  settingMatchClub: (matchClubId: string) =>
    ["matchClub", matchClubId, "position", "setting", "matchClub"] as const,
} as const;

type UsePositionQueryOptions = {
  enabled?: boolean;
};

export function usePositionQuery(matchClubId?: string, options?: UsePositionQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => positionQueryKeys.detail(matchClubId ?? ""), [matchClubId]);

  return useQuery<PositionQueryData>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch positions");
      }
      return getJson<PositionQueryData>(`/api/attendances?matchClubId=${matchClubId}`, {
        auth: true,
      });
    },
    enabled,
  });
}

type UseQuarterQueryOptions = {
  enabled?: boolean;
};

export function useQuarterQuery(matchClubId?: string, options?: UseQuarterQueryOptions) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(() => positionQueryKeys.quarters(matchClubId ?? ""), [matchClubId]);

  return useQuery<PositionQuarterData>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch quarters");
      }
      return getJson<PositionQuarterData>(`/api/matchClubs/${matchClubId}/position/quarters`, {
        auth: true,
      });
    },
    enabled,
  });
}

export const PositionContext = createContext<PositionContextValue>(null);

export function usePositionContext() {
  return useContext(PositionContext);
}

type UsePositionSettingQueryOptions = {
  enabled?: boolean;
};

export function usePositionSettingQuery(
  matchClubId?: string,
  options?: UsePositionSettingQueryOptions,
) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(
    () => positionQueryKeys.settingAttendances(matchClubId ?? ""),
    [matchClubId],
  );
  return useQuery<PositionSettingQueryData>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch attendances");
      }
      return getJson<PositionSettingQueryData>(
        `/api/matchClubs/${matchClubId}/position/attendances`,
        {
          auth: true,
        },
      );
    },
    enabled,
  });
}

type UsePositionSettingMatchClubQueryOptions = {
  enabled?: boolean;
};

export function usePositionSettingMatchClubQuery(
  matchClubId?: string,
  options?: UsePositionSettingMatchClubQueryOptions,
) {
  const enabled = options?.enabled ?? Boolean(matchClubId);
  const queryKey = useMemo(
    () => positionQueryKeys.settingMatchClub(matchClubId ?? ""),
    [matchClubId],
  );
  return useQuery<PositionSettingMatchClubData>({
    queryKey,
    queryFn: async () => {
      if (!matchClubId) {
        throw new Error("matchClubId is required to fetch position setting meta");
      }
      return getJson<PositionSettingMatchClubData>(
        `/api/matchClubs/${matchClubId}/position/setting`,
        { auth: true },
      );
    },
    enabled,
  });
}

type PositionUpdateOptions = {
  url?: string | null;
  matchClubId?: string | null;
};

type PositionSocketMessage =
  | { type: "POSITION_UPDATED"; assigneds: PositionAttendance["assigneds"] }
  | { type: "POSITION_CREATED"; assigneds: PositionAttendance["assigneds"] }
  | { type: "POSITION_REMOVED"; assignedIds: string[] };

export function usePositionUpdate({ url, matchClubId }: PositionUpdateOptions) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  useEffect(() => {
    if (!url || !queryKey) {
      return;
    }
    const socket = new BrowserStableWebSocket(url, {
      onMessage: (payload) => {
        const data = payload as PositionSocketMessage;
        queryClient.setQueryData<PositionQueryData>(queryKey, (old) => {
          if (!old) return old;
          if (data.type === "POSITION_UPDATED") {
            const incoming = data.assigneds;
            const updated = old.attendances.map((attendance) => {
              const additions = incoming.filter(
                (assigned) => assigned.attendanceId === attendance.id,
              );
              const nextAssigneds = attendance.assigneds
                .filter((assigned) => {
                  const found = incoming.find((a) => a.id === assigned.id);
                  if (!found) return true;
                  return found.attendanceId === attendance.id;
                })
                .map((assigned) => {
                  const found = incoming.find((a) => a.id === assigned.id);
                  if (found) {
                    return {
                      ...assigned,
                      position: found.position,
                      teamId: found.teamId ?? assigned.teamId,
                    };
                  }
                  return assigned;
                });
              const merged = [
                ...nextAssigneds,
                ...additions.filter(
                  (addition) => !nextAssigneds.some((assigned) => assigned.id === addition.id),
                ),
              ];
              return { ...attendance, assigneds: merged };
            });
            return { attendances: updated };
          }
          if (data.type === "POSITION_CREATED") {
            const incoming = data.assigneds;
            const updated = old.attendances.map((attendance) => {
              const additions = incoming.filter(
                (assigned) => assigned.attendanceId === attendance.id,
              );
              return {
                ...attendance,
                assigneds: [...attendance.assigneds, ...additions],
              };
            });
            return { attendances: updated };
          }
          if (data.type === "POSITION_REMOVED") {
            const updated = old.attendances.map((attendance) => ({
              ...attendance,
              assigneds: attendance.assigneds.filter(
                (assigned) => !data.assignedIds.includes(assigned.id),
              ),
            }));
            return { attendances: updated };
          }
          return old;
        });
      },
    });
    return () => {
      socket.close();
    };
  }, [url, queryClient, queryKey]);
}

export function useOptimisticPositionUpdate(matchClubId?: string) {
  const queryClient = useQueryClient();
  const queryKey = matchClubId ? positionQueryKeys.settingAttendances(matchClubId) : null;

  return useMutation({
    mutationFn: async (value: {
      attendanceId: string;
      assignedId: string;
      toPosition: POSITION_TYPE;
    }) => {
      return postJson(
        "/api/assigneds/position",
        { assignedId: value.assignedId, toPosition: value.toPosition },
        { auth: true },
      );
    },
    onMutate: async (_value) => {
      if (!queryKey || !matchClubId) return undefined;
      const oldData = queryClient.getQueryData<PositionSettingQueryData>(queryKey);
      await queryClient.cancelQueries({ queryKey });
      const currentData = oldData?.attendances.find((item) => item.id === _value.attendanceId);
      if (!currentData) return { oldData };
      const currentAssigned = currentData.assigneds.find((item) => item.id === _value.assignedId);
      if (!currentAssigned) return { oldData };
      const teamId = currentAssigned.teamId;
      const fromPosition = currentAssigned.position;
      const toPosition = _value.toPosition;
      const quarterId = currentAssigned.quarterId;

      queryClient.setQueryData<PositionSettingQueryData>(queryKey, {
        attendances: (oldData?.attendances ?? []).map((item) => {
          const findOne = item.assigneds.find(
            (assigned) =>
              assigned.quarterId === quarterId &&
              assigned.teamId === teamId &&
              assigned.position === toPosition,
          );
          if (findOne) {
            return {
              ...item,
              assigneds: item.assigneds.map((assigned) =>
                assigned.id !== findOne.id ? assigned : { ...assigned, position: fromPosition },
              ),
            };
          }
          if (item.id === _value.attendanceId) {
            return {
              ...item,
              assigneds: item.assigneds.map((assigned) =>
                assigned.id !== _value.assignedId
                  ? assigned
                  : { ...assigned, position: _value.toPosition },
              ),
            };
          }
          return item;
        }),
      });
      return { oldData };
    },
    onError: (_err, _value, context) => {
      if (!queryKey) return;
      queryClient.setQueryData(queryKey, context?.oldData);
    },
    onSettled: () => {
      if (!queryKey) return;
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

type AssignSlotInput = {
  attendanceId: string;
  quarterId: string;
  position: POSITION_TYPE;
  teamId?: string | null;
};

export function usePositionAssignMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const settingKey = useMemo(
    () => (matchClubId ? positionQueryKeys.settingAttendances(matchClubId) : null),
    [matchClubId],
  );
  const matchClubKey = useMemo(
    () => (matchClubId ? positionQueryKeys.quarters(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, AssignSlotInput>({
    mutationFn: async (input) => {
      return putJson("/api/assigneds/slot", input, { auth: true });
    },
    onSuccess: async () => {
      if (settingKey) {
        await queryClient.invalidateQueries({ queryKey: settingKey });
      }
      if (matchClubKey) {
        await queryClient.invalidateQueries({ queryKey: matchClubKey });
      }
    },
  });
}

type DeleteAssignedInput = {
  id: string;
  attendanceId: string;
  quarterId: string;
  position: POSITION_TYPE;
};

export function usePositionAssignedDeleteMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const settingKey = useMemo(
    () => (matchClubId ? positionQueryKeys.settingAttendances(matchClubId) : null),
    [matchClubId],
  );
  const matchClubKey = useMemo(
    () => (matchClubId ? positionQueryKeys.quarters(matchClubId) : null),
    [matchClubId],
  );
  const boardKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, DeleteAssignedInput>({
    mutationFn: async (input) => {
      return del("/api/assigneds", { body: JSON.stringify(input), auth: true });
    },
    onSuccess: async () => {
      if (settingKey) {
        await queryClient.invalidateQueries({ queryKey: settingKey });
      }
      if (matchClubKey) {
        await queryClient.invalidateQueries({ queryKey: matchClubKey });
      }
      if (boardKey) {
        await queryClient.invalidateQueries({ queryKey: boardKey });
      }
    },
  });
}

type AttendanceStateUpdateInput = {
  id: string;
  state: AttendanceState;
};

export function usePositionAttendanceStateMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const settingKey = useMemo(
    () => (matchClubId ? positionQueryKeys.settingAttendances(matchClubId) : null),
    [matchClubId],
  );
  const boardKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );

  return useMutation<unknown, unknown, AttendanceStateUpdateInput>({
    mutationFn: async (input) => {
      return putJson("/api/attendances", input, { auth: true });
    },
    onSuccess: async () => {
      if (settingKey) {
        await queryClient.invalidateQueries({ queryKey: settingKey });
      }
      if (boardKey) {
        await queryClient.invalidateQueries({ queryKey: boardKey });
      }
    },
  });
}

export const PositionSettingContext = createContext<PositionSettingContextValue>(null);

export function usePositionSettingContext() {
  return useContext(PositionSettingContext);
}
