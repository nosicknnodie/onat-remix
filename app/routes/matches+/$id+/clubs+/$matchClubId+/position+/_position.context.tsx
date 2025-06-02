import { Prisma } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import React from "react";
export const PositionContext = React.createContext({ currentQuarterOrder: 1 } as {
  query: Awaited<ReturnType<typeof usePositionQuery>>;
  currentQuarterOrder: number;
});

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

export const usePositionQuery = () => {
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
