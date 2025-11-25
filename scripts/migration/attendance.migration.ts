/**
 

model Attendance {
  id          String    @id @default(cuid())
  isVote      Boolean   @default(false)   // 참석투표 여부
  voteTime    DateTime?                   // 참석투표 시간

  isCheck     Boolean   @default(false)   // 출석체크
  checkTime   DateTime?                   // 출석체크 시간

  state       AttendanceState @default(NORMAL)
  
  playerId        String?   // 선수 fkey
  mercenaryId     String?   // 용병 fkey
  matchClubId     String    // 매치 fkey
  teamId          String?   // 팀 fkey

  player      Player?     @relation(fields: [playerId], references: [id], onDelete: SetNull)
  mercenary   Mercenary?  @relation(fields: [mercenaryId], references: [id], onDelete: SetNull)
  team        Team?       @relation(fields: [teamId], references: [id], onDelete: SetNull)
  matchClub   MatchClub       @relation(fields: [matchClubId], references: [id], onDelete: Cascade)

  ratingStats   AttendanceRatingStats?
  ratingVote    AttendanceRatingVote?
  statsHistory  AttendanceStatsHistory?
  assigneds   Assigned[]
  evaluations Evaluation[]
  records     Record[]
  assistRecords Record[] @relation("AssistAttendance")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt

  @@index([playerId])
  @@index([teamId])
  @@index([matchClubId])
  @@index([mercenaryId])
  @@unique([matchClubId, mercenaryId])
 @@unique([matchClubId, playerId])
}
 */
import type { Prisma } from "@prisma/client";
import { AttendanceState } from "@prisma/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { AES } from "~/libs/index.server";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyAttendanceRow = {
  match_uid: string | null;
  player_uid: string | null;
  is_vote_band?: boolean | null;
  is_vote_add?: boolean | null;
  is_vote_non?: boolean | null;
  attendance_state?: string | null;
  attendance_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  team_name?: string | null;
  score?: number | null;
};

type LegacyMercenaryRow = {
  match_uid: string | null;
  name: string | null;
  phone_num: string | null;
  is_used?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  team_name?: string | null;
};

const normalizePhone = (phone?: string | null) => (phone ?? "").replace(/[^0-9]/g, "");
const normalizeName = (name?: string | null) => (name ?? "").trim().toLowerCase();

export const attendanceMigration = async () => {
  console.log("⏳ [attendanceMigration] fetch attendances from supabase");
  const rows: LegacyAttendanceRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let lastError: PostgrestError | null = null;

  // Supabase range 호출은 0-indexed, 양 끝 포함
  while (true) {
    const { data, error } = await supabase
      .from("player_match_join")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      lastError = error;
      break;
    }
    if (!data?.length) break;
    rows.push(...(data as LegacyAttendanceRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  if (lastError) {
    console.error("player_match_join select error - ", lastError);
    return;
  }

  console.log("ℹ️ [attendanceMigration] fetched rows", { total: rows.length });

  console.log("⏳ [attendanceMigration] fetch mercenaries from supabase");
  const mercRows: LegacyMercenaryRow[] = [];
  let mercFrom = 0;
  while (true) {
    const { data, error } = await supabase
      .from("player_mercenary")
      .select("*")
      .range(mercFrom, mercFrom + pageSize - 1);
    if (error) {
      lastError = error;
      break;
    }
    if (!data?.length) break;
    mercRows.push(...(data as LegacyMercenaryRow[]));
    if (data.length < pageSize) break;
    mercFrom += pageSize;
  }
  if (lastError) {
    console.error("player_mercenary select error - ", lastError);
    return;
  }
  console.log("ℹ️ [attendanceMigration] fetched mercenary rows", { total: mercRows.length });

  console.log("⏳ [attendanceMigration] lookup match clubs and players");
  const legacyMatchIds = Array.from(
    new Set(
      [...rows.map((row) => row.match_uid), ...mercRows.map((row) => row.match_uid)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  );

  const [matchClubs, players, club, prismaMatches, legacyMatches, mercenaries] = await Promise.all([
    prisma.matchClub.findMany({
      where: { legacyId: { in: legacyMatchIds } },
      select: { id: true, legacyId: true, isSelf: true },
    }),
    prisma.player.findMany({
      select: { id: true, legacyId: true },
    }),
    prisma.club.findFirst({ where: { name: "슈가FC" }, select: { id: true } }),
    prisma.match.findMany({
      select: {
        id: true,
        title: true,
        stDate: true,
        matchClubs: { select: { id: true, clubId: true, isSelf: true } },
      },
    }),
    supabase.from("match").select("uid,title,st_date"),
    prisma.mercenary.findMany({
      where: { club: { name: "슈가FC" } },
      select: { id: true, name: true, hp: true },
    }),
  ]);

  if (!club) {
    console.error("❌ [attendanceMigration] club not found");
    return;
  }

  const matchClubEntries = matchClubs.map((mc) => ({
    id: mc.id,
    isSelf: mc.isSelf,
    legacyId: mc.legacyId ?? undefined,
  }));

  const matchClubMap = new Map(
    matchClubEntries
      .filter((mc): mc is { id: string; legacyId: string; isSelf: boolean } => Boolean(mc.legacyId))
      .map((mc) => [mc.legacyId, mc]),
  );
  const playerMap = new Map(
    players
      .filter((player): player is { id: string; legacyId: string } => Boolean(player.legacyId))
      .map((player) => [player.legacyId, player.id]),
  );

  const matchKeyMap = new Map(
    prismaMatches.map((match) => [
      `${match.title ?? ""}__${new Date(match.stDate).toISOString()}`,
      match,
    ]),
  );
  const matchClubStartMap = new Map(
    prismaMatches.flatMap((match) => match.matchClubs.map((mc) => [mc.id, match.stDate] as const)),
  );
  const legacyMatchMap = new Map(
    (legacyMatches.data ?? []).map((match) => [
      match.uid as string,
      { title: match.title as string, st_date: match.st_date as string },
    ]),
  );
  const mercenaryKeyMap = new Map(
    mercenaries.map((mer) => {
      const hp = mer.hp ? AES.decrypt(mer.hp) : "";
      const key = `${normalizeName(mer.name)}__${normalizePhone(hp)}`;
      return [key, mer.id];
    }),
  );

  const matchClubIds = Array.from(matchClubEntries.values());
  const existingAttendances = await prisma.attendance.findMany({
    where: { matchClubId: { in: matchClubIds.map((mc) => mc.id) } },
    select: { matchClubId: true, playerId: true, mercenaryId: true },
  });
  const existingKeySet = new Set(
    existingAttendances
      .filter((att) => att.playerId)
      .map((att) => `${att.matchClubId}:${att.playerId}`),
  );
  const existingMercKeySet = new Set(
    existingAttendances
      .filter((att) => att.mercenaryId)
      .map((att) => `${att.matchClubId}:${att.mercenaryId}`),
  );

  const teams = await prisma.team.findMany({
    where: { matchClubId: { in: matchClubIds.map((mc) => mc.id) } },
    select: { id: true, name: true, matchClubId: true },
  });
  const teamMap = new Map<string, { id: string; name: string }[]>();
  for (const team of teams) {
    const list = teamMap.get(team.matchClubId) ?? [];
    list.push({ id: team.id, name: team.name });
    teamMap.set(team.matchClubId, list);
  }

  const resolveTeamId = (
    matchClubId: string,
    matchClubEntry: { isSelf: boolean } | undefined,
    teamNameRaw?: string | null,
  ) => {
    if (!matchClubEntry?.isSelf) return undefined;
    const teamsForMatch = teamMap.get(matchClubId) ?? [];
    if (!teamsForMatch.length) return undefined;
    const normalized = (teamNameRaw ?? "").trim().toLowerCase();
    const team1 = teamsForMatch[0]?.id;
    const team2 = teamsForMatch[1]?.id ?? team1;

    if (normalized.startsWith("a")) return team1;
    if (normalized.startsWith("b")) return team2;

    return undefined;
  };

  const toCreate: Prisma.AttendanceCreateManyInput[] = [];
  let missingMatchClubCount = 0;
  let missingPlayerCount = 0;
  let skippedExistingCount = 0;
  for (const row of rows) {
    let matchClubEntry: { id: string; isSelf: boolean; legacyId?: string } | undefined =
      row.match_uid ? matchClubMap.get(row.match_uid) : undefined;
    let matchClubId = matchClubEntry?.id;
    if (!matchClubId && row.match_uid) {
      const legacyMatch = legacyMatchMap.get(row.match_uid);
      if (legacyMatch) {
        const key = `${legacyMatch.title ?? ""}__${new Date(legacyMatch.st_date).toISOString()}`;
        const match = matchKeyMap.get(key);
        const mc = match?.matchClubs.find((m) => m.clubId === club.id);
        if (mc) {
          matchClubEntry = { id: mc.id, isSelf: mc.isSelf };
        }
        matchClubId = matchClubEntry?.id;
      }
    }
    const playerId = row.player_uid ? playerMap.get(row.player_uid) : undefined;

    if (!matchClubId) {
      missingMatchClubCount += 1;
      continue;
    }
    if (!playerId) {
      missingPlayerCount += 1;
      continue;
    }

    const key = `${matchClubId}:${playerId}`;
    if (existingKeySet.has(key)) {
      skippedExistingCount += 1;
      continue;
    }

    const teamId = resolveTeamId(matchClubId, matchClubEntry, row.team_name);
    const voteTime = row.created_at ? new Date(row.created_at) : undefined;
    const checkTime = row.attendance_at ? new Date(row.attendance_at) : undefined;
    const state = row.attendance_state === "N" ? AttendanceState.EXCUSED : AttendanceState.NORMAL;

    const data: Prisma.AttendanceCreateManyInput = {
      matchClubId,
      playerId,
      isVote: Boolean((row.is_vote_band && !row.is_vote_non) || row.is_vote_add),
      isCheck: Boolean(checkTime),
      state,
      teamId,
    };

    if (voteTime) {
      data.voteTime = voteTime;
      data.createdAt = voteTime;
    }
    if (checkTime) {
      data.checkTime = checkTime;
    }
    if (row.updated_at) {
      data.updatedAt = new Date(row.updated_at);
    }

    toCreate.push(data);
  }

  let missingMercMatchClubCount = 0;
  let missingMercenaryCount = 0;
  let skippedExistingMercCount = 0;

  for (const row of mercRows) {
    if (row.is_used === false) continue;
    let matchClubEntry: { id: string; isSelf: boolean; legacyId?: string } | undefined =
      row.match_uid ? matchClubMap.get(row.match_uid) : undefined;
    let matchClubId = matchClubEntry?.id;
    if (!matchClubId && row.match_uid) {
      const legacyMatch = legacyMatchMap.get(row.match_uid);
      if (legacyMatch) {
        const key = `${legacyMatch.title ?? ""}__${new Date(legacyMatch.st_date).toISOString()}`;
        const match = matchKeyMap.get(key);
        const mc = match?.matchClubs.find((m) => m.clubId === club.id);
        if (mc) {
          matchClubEntry = { id: mc.id, isSelf: mc.isSelf };
        }
        matchClubId = matchClubEntry?.id;
      }
    }

    if (!matchClubId) {
      missingMercMatchClubCount += 1;
      continue;
    }

    const nameKey = normalizeName(row.name);
    const phoneKey = normalizePhone(row.phone_num);
    const mercenaryId = mercenaryKeyMap.get(`${nameKey}__${phoneKey}`);

    if (!mercenaryId) {
      missingMercenaryCount += 1;
      continue;
    }

    const key = `${matchClubId}:${mercenaryId}`;
    if (existingMercKeySet.has(key)) {
      skippedExistingMercCount += 1;
      continue;
    }

    const teamId = resolveTeamId(matchClubId, matchClubEntry, row.team_name);
    const data: Prisma.AttendanceCreateManyInput = {
      matchClubId,
      mercenaryId,
      isVote: true,
      voteTime: row.created_at ? new Date(row.created_at) : undefined,
      isCheck: true,
      checkTime: (() => {
        const stDate = matchClubStartMap.get(matchClubId);
        if (!stDate) return undefined;
        const start = new Date(stDate);
        return new Date(start.getTime() - 30 * 60 * 1000);
      })(),
      state: AttendanceState.NORMAL,
      teamId,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };

    toCreate.push(data);
    existingMercKeySet.add(key);
  }

  if (toCreate.length === 0) {
    console.log("ℹ️ [attendanceMigration] nothing to migrate", {
      totalFetched: rows.length,
      missingMatchClubCount,
      missingPlayerCount,
      skippedExistingCount,
      missingMercMatchClubCount,
      missingMercenaryCount,
      skippedExistingMercCount,
    });
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < toCreate.length; i += batchSize) {
    const slice = toCreate.slice(i, i + batchSize);
    await prisma.attendance.createMany({
      data: slice,
      skipDuplicates: true,
    });
    console.log("⏳ [attendanceMigration] inserted batch", {
      processed: Math.min(i + batchSize, toCreate.length),
      total: toCreate.length,
    });
  }

  console.log("✅ [attendanceMigration] completed", {
    created: toCreate.length,
    totalFetched: rows.length,
    missingMatchClubCount,
    missingPlayerCount,
    skippedExistingCount,
  });
};
