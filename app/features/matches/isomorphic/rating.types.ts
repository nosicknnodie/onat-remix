import type { Prisma } from "@prisma/client";

export type RatingAttendance = Prisma.AttendanceGetPayload<{
  include: {
    evaluations: true;
    records: { where: { isOwnGoal: false } };
    assigneds: true;
    player: { include: { user: { include: { userImage: true } } } };
    mercenary: { include: { user: { include: { userImage: true } } } };
  };
}>;

export type RatingMatchClub = Prisma.MatchClubGetPayload<{
  include: {
    quarters: { include: { team1: true; team2: true } };
  };
}>;

export type RatingPageResponse = {
  attendances: RatingAttendance[];
  matchClub: RatingMatchClub | null;
};

export type RatingRegisterAttendanceRaw = Prisma.AttendanceGetPayload<{
  include: {
    records: {
      where: { isOwnGoal: false };
      include: {
        quarter: true;
        team: true;
        assistAttendance: {
          include: {
            player: { include: { user: { include: { userImage: true } } } };
            mercenary: { include: { user: { include: { userImage: true } } } };
          };
        };
      };
    };
    assigneds: {
      include: {
        quarter: true;
        team: true;
      };
    };
    player: { include: { user: { include: { userImage: true } } } };
    mercenary: { include: { user: { include: { userImage: true } } } };
    evaluations: {
      select: {
        id: true;
        score: true;
        liked: true;
      };
    };
  };
}>;

export type RatingRegisterAttendance = Omit<RatingRegisterAttendanceRaw, "evaluations"> & {
  myEvaluation: RatingRegisterAttendanceRaw["evaluations"][number] | null;
};

export type RatingRegisterResponse = {
  attendances: RatingRegisterAttendance[];
  matchClub: RatingMatchClub | null;
};

export type RatingStatsItem = Prisma.AttendanceRatingStatsGetPayload<{
  include: {
    attendance: {
      include: {
        player: { include: { user: { include: { userImage: true } } } };
        mercenary: { include: { user: { include: { userImage: true } } } };
      };
    };
  };
}>;

export type RatingStatsResponse = {
  stats: RatingStatsItem[];
};
