import type { AttendanceState, PositionType } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo } from "react";
import { del, getJson, postJson, putJson } from "~/libs/client/api-client";
import { BrowserStableWebSocket } from "~/libs/client/browserStableWebSocket";
import type { POSITION_TYPE } from "~/libs/isomorphic/const/position.const";
import type {
  PositionAttendance,
  PositionContextValue,
  PositionQuarterData,
  PositionQueryData,
  PositionSettingMatchClubData,
} from "./position.types";

export const positionQueryKeys = {
  detail: (matchClubId: string) => ["matchClub", matchClubId, "position", "attendances"] as const,
  quarters: (matchClubId: string) => ["matchClub", matchClubId, "position", "quarters"] as const,
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
      return getJson<PositionQueryData>(`/api/matchClubs/${matchClubId}/position/attendances`);
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
      return getJson<PositionQuarterData>(`/api/matchClubs/${matchClubId}/position/quarters`);
    },
    enabled,
  });
}
export const PositionContext = createContext<PositionContextValue>({
  currentQuarterOrder: 1,
  currentQuarter: undefined,
  currentTeamId: null,
});

export function usePositionContext() {
  return useContext(PositionContext);
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
  | { type: "POSITION_REMOVED"; assignedIds: string[] }
  | { type: "POSITION_RESET"; quarterId: string; teamId: string | null };

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
          if (data.type === "POSITION_RESET") {
            const updated = old.attendances.map((attendance) => ({
              ...attendance,
              assigneds: attendance.assigneds.filter((assigned) => {
                if (assigned.quarterId !== data.quarterId) return true;
                if (data.teamId && assigned.teamId !== data.teamId) return true;
                return false;
              }),
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
  const positionKey = matchClubId ? positionQueryKeys.detail(matchClubId) : null;

  return useMutation({
    mutationFn: async (value: {
      attendanceId: string;
      assignedId: string;
      toPosition: POSITION_TYPE;
    }) => {
      return postJson("/api/assigneds/position", {
        assignedId: value.assignedId,
        toPosition: value.toPosition,
      });
    },
    onMutate: async (_value) => {
      if (!positionKey || !matchClubId) return undefined;
      const oldData = queryClient.getQueryData<PositionQueryData>(positionKey);
      await queryClient.cancelQueries({ queryKey: positionKey });
      const currentData = oldData?.attendances.find((item) => item.id === _value.attendanceId);
      if (!currentData) return { oldData };
      const currentAssigned = currentData.assigneds.find((item) => item.id === _value.assignedId);
      if (!currentAssigned) return { oldData };
      const teamId = currentAssigned.teamId;
      const fromPosition = currentAssigned.position;
      const toPosition = _value.toPosition;
      const quarterId = currentAssigned.quarterId;

      queryClient.setQueryData<PositionQueryData>(positionKey, {
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
      if (!positionKey) return;
      queryClient.setQueryData(positionKey, context?.oldData);
    },
    onSettled: () => {
      if (!positionKey) return;
      queryClient.invalidateQueries({ queryKey: positionKey });
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
  const positionKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  const matchClubKey = useMemo(
    () => (matchClubId ? positionQueryKeys.quarters(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, AssignSlotInput>({
    mutationFn: async (input) => {
      return putJson("/api/assigneds/slot", input);
    },
    onSuccess: async () => {
      if (positionKey) {
        await queryClient.invalidateQueries({ queryKey: positionKey });
      }
      if (matchClubKey) {
        await queryClient.invalidateQueries({ queryKey: matchClubKey });
      }
    },
  });
}

type AutoAssignInput = {
  attendanceId: string;
  quarterId: string;
  position: POSITION_TYPE;
  teamId?: string | null;
};

type AutoAssignResponse = {
  success: boolean;
  assigned: PositionAttendance["assigneds"];
};

export function usePositionAutoAssignMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const positionKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<
    AutoAssignResponse,
    unknown,
    AutoAssignInput[],
    { previousData?: PositionQueryData }
  >({
    mutationFn: async (input) => {
      return postJson("/api/assigneds", input);
    },
    onMutate: async (input) => {
      if (!positionKey) return undefined;
      await queryClient.cancelQueries({ queryKey: positionKey });
      const previousData = queryClient.getQueryData<PositionQueryData>(positionKey);
      const now = Date.now();
      const optimisticAssigneds = input.map((assignment, index) => {
        const timestamp = now + index;
        return {
          id: `optimistic-${timestamp}`,
          attendanceId: assignment.attendanceId,
          quarterId: assignment.quarterId,
          position: assignment.position as PositionType,
          teamId: assignment.teamId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies PositionAttendance["assigneds"][number];
      });

      queryClient.setQueryData<PositionQueryData>(positionKey, (old) => {
        if (!old) return old;
        return {
          attendances: old.attendances.map((attendance) => {
            const additions = optimisticAssigneds.filter(
              (assigned) => assigned.attendanceId === attendance.id,
            );
            if (additions.length === 0) return attendance;
            const withoutDuplicate = attendance.assigneds.filter(
              (assigned) =>
                !additions.some(
                  (addition) =>
                    addition.position === assigned.position &&
                    addition.quarterId === assigned.quarterId &&
                    (addition.teamId ?? null) === (assigned.teamId ?? null),
                ),
            );
            return { ...attendance, assigneds: [...withoutDuplicate, ...additions] };
          }),
        };
      });

      return { previousData };
    },
    onError: (_err, _input, context) => {
      if (!positionKey) return;
      if (context?.previousData) {
        queryClient.setQueryData(positionKey, context.previousData);
      }
    },
    onSettled: async () => {
      if (!positionKey) return;
      await queryClient.invalidateQueries({ queryKey: positionKey });
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
  const positionKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  const matchClubKey = useMemo(
    () => (matchClubId ? positionQueryKeys.quarters(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, DeleteAssignedInput>({
    mutationFn: async (input) => {
      return del("/api/assigneds", { body: JSON.stringify(input) });
    },
    onSuccess: async () => {
      if (positionKey) {
        await queryClient.invalidateQueries({ queryKey: positionKey });
      }
      if (matchClubKey) {
        await queryClient.invalidateQueries({ queryKey: matchClubKey });
      }
    },
  });
}

type DeleteAssignedAllInput = {
  quarterId: string;
  teamId: string | null;
};

export function usePositionAssignedDeleteAllMutation(matchClubId?: string) {
  const queryClient = useQueryClient();
  const positionKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );
  const matchClubKey = useMemo(
    () => (matchClubId ? positionQueryKeys.quarters(matchClubId) : null),
    [matchClubId],
  );
  return useMutation<unknown, unknown, DeleteAssignedAllInput>({
    mutationFn: async (input) => {
      return del(`/api/matchClubs/${matchClubId}/position/reset`, { body: JSON.stringify(input) });
    },
    onSuccess: async () => {
      if (positionKey) {
        await queryClient.invalidateQueries({ queryKey: positionKey });
      }
      if (matchClubKey) {
        await queryClient.invalidateQueries({ queryKey: matchClubKey });
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
  const positionKey = useMemo(
    () => (matchClubId ? positionQueryKeys.detail(matchClubId) : null),
    [matchClubId],
  );

  return useMutation<unknown, unknown, AttendanceStateUpdateInput>({
    mutationFn: async (input) => {
      return putJson("/api/attendances", input);
    },
    onSuccess: async () => {
      if (positionKey) {
        await queryClient.invalidateQueries({ queryKey: positionKey });
      }
    },
  });
}
