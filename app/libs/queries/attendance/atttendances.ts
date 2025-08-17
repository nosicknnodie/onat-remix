import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/db.server";

type RatingAttendance = Prisma.AttendanceGetPayload<{
  include: {
    evaluations: true;
    assigneds: { include: { goals: { where: { isOwnGoal: false } } } };
    player: { include: { user: { include: { userImage: true } } } };
    mercenary: { include: { user: { include: { userImage: true } } } };
  };
}>;

export const getRatingAttendances = async ({
  matchClubId,
}: {
  matchClubId: string;
}): Promise<RatingAttendance[]> => {
  const attendances = await prisma.attendance.findMany({
    where: {
      matchClubId,
      isVote: true,
    },
    include: {
      evaluations: true,
      assigneds: { include: { goals: { where: { isOwnGoal: false } } } },
      player: {
        // where: { status: "APPROVED" },
        include: { user: { include: { userImage: true } } },
      },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return attendances;
};

export type IRatingAttendance = RatingAttendance;
