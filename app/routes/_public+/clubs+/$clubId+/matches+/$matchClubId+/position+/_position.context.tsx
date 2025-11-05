/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { Prisma } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { BrowserStableWebSocket } from "~/libs";

type PositionContextType = {
  query: Awaited<ReturnType<typeof usePositionQuery>>;
  currentQuarterOrder: number;
} | null;
export const PositionContext = React.createContext<PositionContextType>(null);

export function usePositionContext() {
  return React.useContext(PositionContext);
}
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

export function usePositionQuery() {
  const params = useParams();
  const matchClubId = params.matchClubId!;
  return useQuery<{ attendances: AttendanceWithAssigned[] }>({
    queryKey: ["ATTENDANCES", matchClubId],
    queryFn: async () => {
      const res = await fetch(`/api/attendances?matchClubId=${matchClubId}`);
      return await res.json();
    },
  });
}

export function usePositionUpdate({ url }: { url: string }) {
  const queryClient = useQueryClient();
  const { matchClubId } = useParams();

  useEffect(() => {
    const socket = new BrowserStableWebSocket(url, {
      onMessage: (data: any) => {
        if (data.type === "POSITION_UPDATED") {
          queryClient.setQueryData(["ATTENDANCES", matchClubId], (old: any) => {
            if (!old) return old;
            const updated = old.attendances.map((attendance: any) => {
              const updatedAssigneds = attendance.assigneds.map((assigned: any) => {
                const found = data.assigneds.find((a: any) => a.id === assigned.id);
                return found ? { ...assigned, position: found.position } : assigned;
              });
              return { ...attendance, assigneds: updatedAssigneds };
            });
            return { attendances: updated };
          });
        }

        if (data.type === "POSITION_CREATED") {
          queryClient.setQueryData(["ATTENDANCES", matchClubId], (old: any) => {
            if (!old) return old;
            const updated = old.attendances.map((attendance: any) => {
              const additions = data.assigneds.filter((a: any) => a.attendanceId === attendance.id);
              return {
                ...attendance,
                assigneds: [...attendance.assigneds, ...additions],
              };
            });
            return { attendances: updated };
          });
        }

        if (data.type === "POSITION_REMOVED") {
          queryClient.setQueryData(["ATTENDANCES", matchClubId], (old: any) => {
            if (!old) return old;
            const updated = old.attendances.map((attendance: any) => {
              return {
                ...attendance,
                assigneds: attendance.assigneds.filter(
                  (assigned: any) => !data.assignedIds.includes(assigned.id),
                ),
              };
            });
            return { attendances: updated };
          });
        }
      },
    });
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [url, queryClient, matchClubId]);
}
