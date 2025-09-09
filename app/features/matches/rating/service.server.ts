import * as q from "./queries.server";
import { getRatingAttendances } from "./queries.server";

export async function getRatingPageData(matchClubId: string) {
  const [matchClub, attendances] = await Promise.all([
    q.findMatchClubWithQuarters(matchClubId),
    getRatingAttendances({ matchClubId }),
  ]);
  return { attendances, matchClub } as const;
}

export async function upsertScore(
  userId: string,
  input: { attendanceId: string; matchClubId: string; score: number },
) {
  const { prisma } = await import("~/libs/db/db.server");
  await prisma.evaluation.upsert({
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
  return { ok: true as const };
}

export async function upsertLike(
  userId: string,
  input: { attendanceId: string; matchClubId: string; liked: boolean },
) {
  const { prisma } = await import("~/libs/db/db.server");
  await prisma.evaluation.upsert({
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
  return { ok: true as const };
}
