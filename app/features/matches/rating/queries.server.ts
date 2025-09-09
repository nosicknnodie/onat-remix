import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithQuarters(matchClubId: string) {
  return await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: { quarters: { include: { team1: true, team2: true } } },
  });
}

type RatingAttendance = Prisma.AttendanceGetPayload<{
  include: {
    evaluations: true;
    assigneds: { include: { goals: { where: { isOwnGoal: false } } } };
    player: { include: { user: { include: { userImage: true } } } };
    mercenary: { include: { user: { include: { userImage: true } } } };
  };
}>;

export async function getRatingAttendances({ matchClubId }: { matchClubId: string }) {
  const attendances = await prisma.attendance.findMany({
    where: { matchClubId, isVote: true },
    include: {
      evaluations: true,
      assigneds: { include: { goals: { where: { isOwnGoal: false } } } },
      player: { include: { user: { include: { userImage: true } } } },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return attendances as RatingAttendance[];
}
