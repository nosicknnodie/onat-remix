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

export const getRatingAttendances = q.getRatingAttendances;
export const getRatingStats = q.getRatingStats;
