import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

export async function findMatchClubWithQuarters(matchClubId: string) {
  return await prisma.matchClub.findFirst({
    where: { id: matchClubId, isUse: true },
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

export async function upsertScoreEvaluation(
  userId: string,
  input: { attendanceId: string; matchClubId: string; score: number },
) {
  return await prisma.evaluation.upsert({
    create: { ...input, userId },
    update: { score: input.score },
    where: {
      userId_matchClubId_attendanceId: {
        userId,
        matchClubId: input.matchClubId,
        attendanceId: input.attendanceId,
      },
    },
  });
}
export async function upsertLikeEvaluation(
  userId: string,
  input: { attendanceId: string; matchClubId: string; liked: boolean },
) {
  return await prisma.evaluation.upsert({
    create: { ...input, userId },
    update: { liked: input.liked },
    where: {
      userId_matchClubId_attendanceId: {
        userId,
        matchClubId: input.matchClubId,
        attendanceId: input.attendanceId,
      },
    },
  });
}
