import type { Prisma } from "@prisma/client";

export type RatingAttendance = Prisma.AttendanceGetPayload<{
  include: {
    evaluations: true;
    assigneds: { include: { goals: { where: { isOwnGoal: false } } } };
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
