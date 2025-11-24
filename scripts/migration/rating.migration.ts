import type { Prisma } from "@prisma/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyRatingRow = {
  player_uid: string | null;
  user_uid: string | null; // evaluator
  match_uid: string | null;
  rating_item_uid?: string | null;
  score?: number | null;
  created_at?: string | null;
};

export const ratingMigration = async () => {
  console.log("⏳ [ratingMigration] fetch ratings from supabase");
  const rows: LegacyRatingRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let lastError: PostgrestError | null = null;
  while (true) {
    const { data, error } = await supabase
      .from("player_rating")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      lastError = error;
      break;
    }
    if (!data?.length) break;
    rows.push(...(data as LegacyRatingRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  if (lastError) {
    console.error("player_rating select error - ", lastError);
    return;
  }

  console.log("ℹ️ [ratingMigration] fetched rows", { total: rows.length });

  const filtered = rows.filter((row) => row.match_uid && row.player_uid && row.user_uid);
  if (!filtered.length) {
    console.log("ℹ️ [ratingMigration] no rows to migrate");
    return;
  }

  const legacyMatchIds = Array.from(
    new Set(filtered.map((row) => row.match_uid).filter((id): id is string => Boolean(id))),
  );

  console.log("⏳ [ratingMigration] lookup prisma data");
  const [matchClubs, attendances, users, existingEvaluations, players] = await Promise.all([
    prisma.matchClub.findMany({
      where: { legacyId: { in: legacyMatchIds } },
      include: { match: true },
    }),
    prisma.attendance.findMany({
      where: { matchClub: { legacyId: { in: legacyMatchIds } } },
      include: { matchClub: true, player: true },
    }),
    prisma.user.findMany({ select: { id: true, legacyId: true } }),
    prisma.evaluation.findMany({
      where: { matchClub: { legacyId: { in: legacyMatchIds } } },
      select: { userId: true, matchClubId: true, attendanceId: true },
    }),
    prisma.player.findMany({ select: { id: true, legacyId: true } }),
  ]);

  const matchClubMap = new Map(
    matchClubs
      .filter((mc): mc is (typeof matchClubs)[number] & { legacyId: string } =>
        Boolean(mc.legacyId),
      )
      .map((mc) => [mc.legacyId, mc]),
  );

  const userMap = new Map(
    users
      .filter((u): u is { id: string; legacyId: string } => Boolean(u.legacyId))
      .map((u) => [u.legacyId, u.id]),
  );
  const playerMap = new Map(
    players
      .filter((p): p is { id: string; legacyId: string } => Boolean(p.legacyId))
      .map((p) => [p.legacyId, p.id]),
  );

  const attendanceByPlayerLegacy = new Map<string, string>();
  attendances.forEach((att) => {
    if (att.matchClub.legacyId && att.player?.legacyId) {
      attendanceByPlayerLegacy.set(`${att.matchClub.legacyId}:${att.player.legacyId}`, att.id);
    }
  });

  const existingKeySet = new Set(
    existingEvaluations.map((ev) => `${ev.userId ?? "null"}:${ev.matchClubId}:${ev.attendanceId}`),
  );

  let missingMatchClubCount = 0;
  let missingAttendanceCount = 0;
  let missingUserCount = 0;

  const toCreate: Prisma.EvaluationCreateManyInput[] = [];

  for (const row of filtered) {
    const matchClub = row.match_uid ? matchClubMap.get(row.match_uid) : undefined;
    if (!matchClub) {
      missingMatchClubCount += 1;
      continue;
    }

    const attendanceId = attendanceByPlayerLegacy.get(
      `${matchClub.legacyId}:${row.player_uid ?? ""}`,
    );
    let resolvedAttendanceId = attendanceId;
    if (!resolvedAttendanceId) {
      const playerId = row.player_uid ? playerMap.get(row.player_uid) : undefined;
      if (playerId) {
        const fallbackAttendance = await prisma.attendance.findFirst({
          where: { matchClubId: matchClub.id, playerId },
          select: { id: true },
        });
        if (fallbackAttendance) {
          resolvedAttendanceId = fallbackAttendance.id;
          attendanceByPlayerLegacy.set(
            `${matchClub.legacyId}:${row.player_uid}`,
            resolvedAttendanceId,
          );
        }
      }
    }
    if (!resolvedAttendanceId) {
      missingAttendanceCount += 1;
      continue;
    }

    const userId = userMap.get(row.user_uid ?? "");
    if (!userId) {
      missingUserCount += 1;
      continue;
    }

    const scoreRaw = row.score ?? 0;
    const score = Math.max(0, Math.min(60, scoreRaw - 40));

    const key = `${userId}:${matchClub.id}:${resolvedAttendanceId}`;
    if (existingKeySet.has(key)) continue;
    existingKeySet.add(key);

    toCreate.push({
      userId,
      matchClubId: matchClub.id,
      attendanceId: resolvedAttendanceId,
      score,
      liked: false,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    });
  }

  if (!toCreate.length) {
    console.log("ℹ️ [ratingMigration] nothing to create", {
      totalFetched: rows.length,
      filtered: filtered.length,
      missingMatchClubCount,
      missingAttendanceCount,
      missingUserCount,
    });
    return;
  }

  await prisma.evaluation.createMany({ data: toCreate, skipDuplicates: true });

  console.log("✅ [ratingMigration] completed", {
    created: toCreate.length,
    totalFetched: rows.length,
    filtered: filtered.length,
    missingMatchClubCount,
    missingAttendanceCount,
    missingUserCount,
  });
};
