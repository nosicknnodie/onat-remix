import type { Assigned, Attendance, File, Mercenary, Prisma, Team, User } from "@prisma/client";
import type { UseQueryResult } from "@tanstack/react-query";

export type PositionAttendance = Prisma.AttendanceGetPayload<{
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

export type PositionMatchClub = Prisma.MatchClubGetPayload<{
  include: {
    quarters: {
      include: {
        team1: true;
        team2: true;
      };
    };
  };
}>;

export type PositionSettingMatchClub = Prisma.MatchClubGetPayload<{
  include: {
    quarters: {
      include: {
        team1: true;
        team2: true;
      };
    };
    teams: true;
  };
}>;

export type PositionSettingMatchClubData = {
  matchClub: PositionSettingMatchClub;
};

export type PositionQuarterWithTeams = Prisma.QuarterGetPayload<{
  include: {
    team1: true;
    team2: true;
  };
}>;

export interface PositionAssignedWithAttendance extends Assigned {
  attendance: Attendance & {
    team: Team | null;
    assigneds: Assigned[];
    player: { user: (User & { userImage: File | null }) | null } | null;
    mercenary: (Mercenary & { user: (User & { userImage: File | null }) | null }) | null;
  };
}

export type PositionQuarterData = {
  matchClub: PositionMatchClub;
};

export type PositionQueryData = {
  attendances: PositionAttendance[];
};

export type PositionContextValue = {
  currentQuarterOrder: number;
  currentTeamId: string | null;
};

export type PositionSettingContextValue = {
  query: UseQueryResult<PositionQueryData>;
  currentQuarter: PositionQuarterWithTeams | null;
  currentTeamId: string | null;
  assigneds?: PositionAssignedWithAttendance[];
} | null;
