import { Assigned, Attendance, File, Mercenary, Prisma, Team, User } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { POSITION_TYPE } from "~/libs/const/position.const";

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
export const PositionSettingContext = React.createContext({ currentQuarter: null } as {
  query: Awaited<ReturnType<typeof usePositionSettingQuery>>;
  currentQuarter: QuarterWithTeams | null;
  currentTeamId: string | null;
  assigneds:
    | (Assigned & {
        attendance: Attendance & {
          team: Team | null;
          assigneds: Assigned[];
          player: { user: (User & { userImage: File | null }) | null } | null;
          mercenary: (Mercenary & { user: (User & { userImage: File | null }) | null }) | null;
        };
      })[]
    | undefined;
});

export const usePositionSettingQuery = () => {
  const params = useParams();
  const matchClubId = params.matchClubId!;
  return useQuery<{ attendances: AttendanceWithAssigned[] }>({
    queryKey: ["ATTENDANCES", matchClubId],
    queryFn: async () => {
      const res = await fetch("/api/attendances?matchClubId=" + matchClubId);
      return await res.json();
    },
  });
};

/**
 * 포지션변경의 낙관적 업데이트
 * @returns
 */
export const useOptimisticPositionUpdate = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const matchClubId = params.matchClubId!;
  return useMutation({
    mutationFn: async (value: {
      attendanceId: string;
      assignedId: string;
      toPosition: POSITION_TYPE;
    }) => {
      const res = await fetch("/api/assigneds/position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedId: value.assignedId,
          toPosition: value.toPosition,
        }),
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
          // 기존 자리에 있던 사람을 옮기려는 사람의 기존 자리에 배치
          const findOne = item.assigneds.find(
            (assigned) =>
              assigned.quarterId === quarterId &&
              assigned.teamId === teamId &&
              assigned.position === toPosition,
          );
          if (findOne) {
            return {
              ...item,
              assigneds: item.assigneds.map((assigned) => {
                if (assigned.id !== findOne.id) return assigned;
                return { ...assigned, position: fromPosition };
              }),
            };
          }
          // 옮기려는 선수의 이동할 자리로 배치
          if (item.id === _value.attendanceId) {
            return {
              ...item,
              assigneds: item.assigneds.map((assigned) => {
                if (assigned.id !== _value.assignedId) return assigned;
                return { ...assigned, position: _value.toPosition };
              }),
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

export const usePositionSettingContext = () => React.useContext(PositionSettingContext);
