import type { Prisma } from "@prisma/client";
import { GoalType } from "@prisma/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { AES } from "~/libs/index.server";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyRecordRow = {
  uid: string;
  created_at?: string | null;
  player_uid?: string | null;
  player_mercenary_uid?: string | null;
  match_uid?: string | null;
  quarter?: number | null;
  goal?: number | null;
  team_name?: string | null;
  own_goal?: number | boolean | null;
};

const normalizePhone = (phone?: string | null) => (phone ?? "").replace(/[^0-9]/g, "");
const normalizeName = (name?: string | null) => (name ?? "").trim().toLowerCase();

export const recordMigration = async () => {
  console.log("⏳ [recordMigration] fetch records from supabase");
  const rows: LegacyRecordRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let lastError: PostgrestError | null = null;
  while (true) {
    const { data, error } = await supabase
      .from("player_record")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      lastError = error;
      break;
    }
    if (!data?.length) break;
    rows.push(...(data as LegacyRecordRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (lastError) {
    console.error("player_record select error - ", lastError);
    return;
  }
  console.log("ℹ️ [recordMigration] fetched rows", { total: rows.length });

  const filtered = rows.filter(
    (row) => row.match_uid && (row.player_uid || row.player_mercenary_uid),
  );
  if (!filtered.length) {
    console.log("ℹ️ [recordMigration] no rows to migrate");
    return;
  }

  const legacyMatchIds = Array.from(
    new Set(filtered.map((row) => row.match_uid).filter((id): id is string => Boolean(id))),
  );

  console.log("⏳ [recordMigration] lookup prisma data");
  const [matchClubs, attendances, recordsExisting, mercenaries, legacyMercs] = await Promise.all([
    prisma.matchClub.findMany({
      where: { legacyId: { in: legacyMatchIds } },
      include: { quarters: true, teams: true, match: true },
    }),
    prisma.attendance.findMany({
      where: { matchClub: { legacyId: { in: legacyMatchIds } } },
      include: {
        matchClub: true,
        player: { select: { id: true, legacyId: true, userId: true } },
        mercenary: { select: { id: true } },
      },
    }),
    prisma.record.findMany({
      where: { attendance: { matchClub: { legacyId: { in: legacyMatchIds } } } },
      select: { attendanceId: true, quarterId: true, isOwnGoal: true, goalType: true },
    }),
    prisma.mercenary.findMany({ select: { id: true, name: true, hp: true, clubId: true } }),
    supabase.from("player_mercenary").select("uid,name,phone_num,club_id"),
  ]);

  const matchClubMap = new Map(
    matchClubs
      .filter((mc): mc is (typeof matchClubs)[number] & { legacyId: string } =>
        Boolean(mc.legacyId),
      )
      .map((mc) => [mc.legacyId, mc]),
  );

  const attendanceByPlayerLegacy = new Map<string, string>();
  const attendanceByMerc = new Map<string, string>();
  attendances.forEach((att) => {
    if (att.matchClub.legacyId && att.player?.legacyId) {
      attendanceByPlayerLegacy.set(`P:${att.matchClub.legacyId}:${att.player.legacyId}`, att.id);
    }
    if (att.matchClub.legacyId && att.mercenaryId) {
      attendanceByMerc.set(`M:${att.matchClub.legacyId}:${att.mercenaryId}`, att.id);
    }
  });

  const mercKeyMap = new Map(
    mercenaries.map((mer) => {
      const hp = mer.hp ? AES.decrypt(mer.hp) : "";
      const key = `${normalizeName(mer.name)}__${normalizePhone(hp)}__${mer.clubId}`;
      return [key, mer.id];
    }),
  );

  const mercUidToKey = new Map<string, string>();
  if (legacyMercs.data) {
    legacyMercs.data.forEach((mer) => {
      const key = `${normalizeName(mer.name as string)}__${normalizePhone(mer.phone_num as string)}__${
        mer.club_id as string
      }`;
      mercUidToKey.set(mer.uid as string, key);
    });
  }

  const teamMap = new Map<string, { id: string; name: string }[]>();
  matchClubs.forEach((mc) => {
    teamMap.set(
      mc.id,
      mc.teams.map((t) => ({ id: t.id, name: t.name })),
    );
  });

  const resolveTeamId = (matchClub: (typeof matchClubs)[number], teamName?: string | null) => {
    if (!matchClub.isSelf) return null;
    const teams = teamMap.get(matchClub.id) ?? [];
    if (!teams.length) return null;
    const lower = (teamName ?? "").toLowerCase();
    if (lower === "a") {
      return (
        teams.find((team) => team.name.toLowerCase().includes("a"))?.id ?? teams[0]?.id ?? null
      );
    }
    if (lower === "b") {
      return (
        teams.find((team) => team.name.toLowerCase().includes("b"))?.id ??
        teams[1]?.id ??
        teams[0]?.id ??
        null
      );
    }
    return null;
  };

  const ensureQuarter = async (
    matchClub: (typeof matchClubs)[number],
    order: number,
    teamId1?: string | null,
    teamId2?: string | null,
  ) => {
    const existing = matchClub.quarters.find((q) => q.order === order);
    if (existing) return existing;
    const created = await prisma.quarter.create({
      data: {
        matchClubId: matchClub.id,
        order,
        isSelf: matchClub.isSelf,
        team1Id: matchClub.isSelf ? (teamId1 ?? null) : null,
        team2Id: matchClub.isSelf ? (teamId2 ?? null) : null,
      },
    });
    matchClub.quarters.push(created);
    return created;
  };

  const existingCountMap = new Map<string, number>();
  recordsExisting.forEach((rec) => {
    const key = `${rec.attendanceId}:${rec.quarterId}:${rec.isOwnGoal}:${rec.goalType}`;
    existingCountMap.set(key, (existingCountMap.get(key) ?? 0) + 1);
  });

  const requiredCountMap = new Map<
    string,
    {
      attendanceId: string;
      quarterId: string;
      isOwnGoal: boolean;
      goalType: GoalType;
      teamId: string | null;
      createdAt?: Date;
      required: number;
    }
  >();

  let missingMatchClubCount = 0;
  let missingAttendanceCount = 0;

  for (const row of filtered) {
    const matchClub = row.match_uid ? matchClubMap.get(row.match_uid) : undefined;
    if (!matchClub) {
      missingMatchClubCount += 1;
      continue;
    }
    const order = row.quarter && row.quarter > 0 ? row.quarter : 1;
    const quarter =
      matchClub.quarters.find((q) => q.order === order) ??
      (await ensureQuarter(matchClub, order, matchClub.teams[0]?.id, matchClub.teams[1]?.id));
    if (!quarter) continue;

    const attendanceId = (() => {
      if (row.player_uid) {
        const id = attendanceByPlayerLegacy.get(`P:${matchClub.legacyId}:${row.player_uid}`);
        if (id) return id;
      }
      if (row.player_mercenary_uid) {
        const key = mercUidToKey.get(row.player_mercenary_uid);
        const mercId = key ? mercKeyMap.get(key) : undefined;
        if (mercId) {
          const id = attendanceByMerc.get(`M:${matchClub.legacyId}:${mercId}`);
          if (id) return id;
        }
      }
      return null;
    })();

    if (!attendanceId) {
      missingAttendanceCount += 1;
      continue;
    }

    const isOwnGoal = Boolean(row.own_goal);
    const goalCount = Math.max(1, row.goal ?? 1);
    const teamId = resolveTeamId(matchClub, row.team_name);
    const key = `${attendanceId}:${quarter.id}:${isOwnGoal}:${GoalType.NORMAL}`;
    const current = requiredCountMap.get(key);
    const baseCreatedAt = row.created_at ? new Date(row.created_at) : undefined;
    requiredCountMap.set(key, {
      attendanceId,
      quarterId: quarter.id,
      isOwnGoal,
      goalType: GoalType.NORMAL,
      teamId,
      createdAt: current?.createdAt ?? baseCreatedAt,
      required: (current?.required ?? 0) + goalCount,
    });
  }

  const toCreate: Prisma.RecordCreateManyInput[] = [];

  for (const [key, info] of requiredCountMap.entries()) {
    const existing = existingCountMap.get(key) ?? 0;
    const need = info.required - existing;
    for (let i = 0; i < need; i += 1) {
      toCreate.push({
        attendanceId: info.attendanceId,
        quarterId: info.quarterId,
        teamId: info.teamId,
        isOwnGoal: info.isOwnGoal,
        goalType: info.goalType,
        createdAt: info.createdAt,
      });
    }
  }

  if (!toCreate.length) {
    console.log("ℹ️ [recordMigration] nothing to create", {
      totalFetched: rows.length,
      filtered: filtered.length,
      missingMatchClubCount,
      missingAttendanceCount,
    });
    return;
  }

  await prisma.record.createMany({ data: toCreate, skipDuplicates: true });

  console.log("✅ [recordMigration] completed", { created: toCreate.length });
};
