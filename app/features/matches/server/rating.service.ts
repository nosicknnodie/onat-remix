import { prisma } from "~/libs/server";
import type { RatingRegisterAttendance } from "../isomorphic/rating.types";
import * as q from "./rating.queries";

export async function getRatingPageData(matchClubId: string) {
  const [matchClub, attendances] = await Promise.all([
    q.findMatchClubWithQuarters(matchClubId),
    q.getRatingAttendances({ matchClubId }),
  ]);
  return { attendances, matchClub } as const;
}

export async function getRatingRegisterData(matchClubId: string, userId: string) {
  const [matchClub, attendances] = await Promise.all([
    q.findMatchClubWithQuarters(matchClubId),
    q.getRatingRegisterAttendances({ matchClubId, userId }),
  ]);
  const normalized: RatingRegisterAttendance[] = attendances.map(
    ({ evaluations, ...attendance }) => ({
      ...attendance,
      myEvaluation: evaluations[0] ?? null,
    }),
  );
  return { attendances: normalized, matchClub } as const;
}

export async function upsertScore(
  userId: string,
  input: { attendanceId: string; matchClubId: string; score: number },
) {
  await q.upsertScoreEvaluation(userId, input);
  await Promise.all([
    q.recalcAttendanceRatingStats(input.attendanceId),
    q.recalcAttendanceRatingVote(userId, input.matchClubId),
  ]);
  return { ok: true as const };
}

export async function upsertLike(
  userId: string,
  input: { attendanceId: string; matchClubId: string; liked: boolean },
) {
  await q.upsertLikeEvaluation(userId, input);
  await Promise.all([
    q.recalcAttendanceRatingStats(input.attendanceId),
    q.recalcAttendanceRatingVote(userId, input.matchClubId),
  ]);
  return { ok: true as const };
}

export const updateSeeds = async (matchClubId: string, userId: string) => {
  const myAttendance = await prisma.attendance.findFirst({
    where: { matchClubId, player: { userId }, isVote: true },
    include: {
      ratingVote: { select: { hasVoted: true } },
      matchClub: { select: { clubId: true } },
    },
  });
  if (!myAttendance) {
    return { error: "No attendance found" };
  }
  if (myAttendance.ratingVote?.hasVoted) {
    return { ok: true, seeded: false };
  }
  const clubId = myAttendance.matchClub?.clubId;
  if (!clubId) {
    return { error: "Club not found" };
  }
  const myAttendanceId = myAttendance.id;
  await q.updateSeeds(matchClubId, userId, myAttendanceId);
  return { ok: true, seeded: true };
};

export const getRatingAttendances = q.getRatingAttendances;
export const getRatingStats = q.getRatingStats;
