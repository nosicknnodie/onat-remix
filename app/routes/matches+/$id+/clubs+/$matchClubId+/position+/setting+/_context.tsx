import { Assigned, Attendance, File, Mercenary, Prisma, Team, User } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useQuery } from "@tanstack/react-query";
import React from "react";

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
  return useQuery<{ attendances: AttendanceWithAssigned[] }>({
    queryKey: ["ATTENDANCES", params.matchClubId],
    queryFn: async () => {
      const res = await fetch("/api/attendances?matchClubId=" + params.matchClubId);
      return await res.json();
    },
  });
};

export const usePositionSettingContext = () => React.useContext(PositionSettingContext);
