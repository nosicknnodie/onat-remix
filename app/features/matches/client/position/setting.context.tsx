import type { Assigned, Attendance, File, Mercenary, Prisma, Team, User } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { POSITION_TYPE } from "~/libs/const/position.const";

type QuarterWithTeams = Prisma.QuarterGetPayload<{
  include: {
    team1: true;
    team2: true;
  };
}>;

type AttendanceWithAssigned = Prisma.AttendanceGetPayload<{
  include: {
    assigneds: true;
    team: true;
    player: {
      include: {
        user: {
          include: {
            userImage: true;
          };
        };
      };
    };
    mercenary: {
      include: {
        user: {
          include: {
            userImage: true;
          };
        };
      };
    };
  };
}>;

export interface IAssignedWithAttendance extends Assigned {
  attendance: Attendance & {
    team: Team | null;
    assigneds: Assigned[];
    player: { user: (User & { userImage: File | null }) | null } | null;
    mercenary: (Mercenary & { user: (User & { userImage: File | null }) | null }) | null;
  };
}

export const PositionSettingContext = React.createContext({
  currentQuarter: null,
} as {
  query: ReturnType<typeof usePositionSettingQuery>;
  currentQuarter: QuarterWithTeams | null;
  currentTeamId: string | null;
  assigneds: IAssignedWithAttendance[] | undefined;
});

export const usePositionSettingContext = () => React.useContext(PositionSettingContext);

export const usePositionSettingQuery = (matchClubId: string) => {
  return useQuery<{ attendances: AttendanceWithAssigned[] }>({
    queryKey: ["ATTENDANCES", matchClubId],
    queryFn: async () => {
      const res = await fetch(`/api/attendances?matchClubId=${matchClubId}`);
      return await res.json();
    },
  });
};

export const useOptimisticPositionUpdate = (matchClubId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: {
      attendanceId: string;
      assignedId: string;
      toPosition: POSITION_TYPE;
    }) => {
      const res = await fetch("/api/assigneds/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedId: value.assignedId, toPosition: value.toPosition }),
      });
      return await res.json();
    },
    onMutate: async (_value) => {
      const oldData: { attendances: AttendanceWithAssigned[] } | undefined =
        queryClient.getQueryData(["ATTENDANCES", matchClubId]);
      await queryClient.cancelQueries({ queryKey: ["ATTENDANCES", matchClubId] });
      const currentData = oldData?.attendances.find((item) => item.id === _value.attendanceId);
      if (!currentData) return;
      const currentAssigned = currentData.assigneds.find((item) => item.id === _value.assignedId);
      if (!currentAssigned) return;
      const teamId = currentAssigned.teamId;
      const fromPosition = currentAssigned.position;
      const toPosition = _value.toPosition;
      const quarterId = currentAssigned.quarterId;
      queryClient.setQueryData(["ATTENDANCES", matchClubId], {
        attendances: oldData?.attendances.map((item) => {
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
      queryClient.setQueryData(["ATTENDANCES", matchClubId], context?.oldData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ATTENDANCES", matchClubId] });
    },
  });
};
