import * as q from "./rating.queries";

export async function getRatingPageData(matchClubId: string) {
  const [matchClub, attendances] = await Promise.all([
    q.findMatchClubWithQuarters(matchClubId),
    q.getRatingAttendances({ matchClubId }),
  ]);
  return { attendances, matchClub } as const;
}

export async function upsertScore(
  userId: string,
  input: { attendanceId: string; matchClubId: string; score: number },
) {
  await q.upsertScoreEvaluation(userId, input);
  return { ok: true as const };
}

export async function upsertLike(
  userId: string,
  input: { attendanceId: string; matchClubId: string; liked: boolean },
) {
  await q.upsertLikeEvaluation(userId, input);
  return { ok: true as const };
}

export const getRatingAttendances = q.getRatingAttendances;
