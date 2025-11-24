import type { PositionType, Prisma } from "@prisma/client";
import type { PostgrestError } from "@supabase/supabase-js";
import { isDiffPosition, isRLDiffPostion, PORMATION_POSITIONS } from "~/libs/const/position.const";
import { AES } from "~/libs/index.server";
import { supabase } from ".";
import { prisma } from "./prisma.db";

type LegacyPositionRow = {
  match_uid: string | null;
  player_uid: string | null;
  player_mercenary_uid: string | null;
  created_at?: string | null;
  type?: string | null; // quarter order
  obj_type?: string | null; // P or MERCENARY
  team_name?: string | null; // A/B
};

const normalizePhone = (phone?: string | null) => (phone ?? "").replace(/[^0-9]/g, "");
const normalizeName = (name?: string | null) => (name ?? "").trim().toLowerCase();

export const assignedMigration = async () => {
  console.log("⏳ [assignedMigration] fetch positions from supabase");
  const records: LegacyPositionRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let lastError: PostgrestError | null = null;
  while (true) {
    const { data, error } = await supabase
      .from("player_match_position")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      lastError = error;
      break;
    }
    if (!data?.length) break;
    records.push(...(data as LegacyPositionRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (lastError) {
    console.error("player_match_position select error - ", lastError);
    return;
  }
  console.log("ℹ️ [assignedMigration] fetched rows", { total: records.length });
  const filtered = records.filter(
    (row) =>
      row.match_uid &&
      row.obj_type &&
      (row.obj_type === "P" || row.obj_type === "MERCENARY") &&
      row.type &&
      /^\d+$/.test(row.type),
  );
  if (!filtered.length) {
    console.log("ℹ️ [assignedMigration] no position rows");
    return;
  }

  console.log("⏳ [assignedMigration] lookup match clubs/quarters/teams/attendances");
  const legacyMatchIds = Array.from(
    new Set(filtered.map((row) => row.match_uid).filter((id): id is string => Boolean(id))),
  );

  const [matchClubs, players, mercenaries, attendances] = await Promise.all([
    prisma.matchClub.findMany({
      where: { legacyId: { in: legacyMatchIds } },
      include: { quarters: true, teams: true, match: true },
    }),
    prisma.player.findMany({ select: { id: true, legacyId: true } }),
    prisma.mercenary.findMany({ select: { id: true, name: true, hp: true, clubId: true } }),
    prisma.attendance.findMany({
      where: { matchClub: { legacyId: { in: legacyMatchIds } } },
      include: {
        matchClub: true,
        assigneds: true,
        player: { include: { user: true } },
        mercenary: true,
      },
    }),
  ]);

  const _playerMap = new Map(
    players
      .filter((p): p is { id: string; legacyId: string } => Boolean(p.legacyId))
      .map((p) => [p.legacyId, p.id]),
  );
  const _mercenaryKeyMap = new Map(
    mercenaries.map((mer) => {
      const hp = mer.hp ? AES.decrypt(mer.hp) : "";
      const key = `${normalizeName(mer.name)}__${normalizePhone(hp)}__${mer.clubId}`;
      return [key, mer.id];
    }),
  );
  const matchClubMap = new Map(
    matchClubs
      .filter((mc): mc is (typeof matchClubs)[number] & { legacyId: string } =>
        Boolean(mc.legacyId),
      )
      .map((mc) => [mc.legacyId, mc]),
  );
  const _attendanceMap = new Map(
    attendances.map((att) => {
      const key =
        att.playerId && att.matchClub.legacyId
          ? `P:${att.matchClub.legacyId}:${att.playerId}`
          : att.mercenaryId && att.matchClub.legacyId
            ? `M:${att.matchClub.legacyId}:${att.mercenaryId}`
            : null;
      return [key, att.id] as const;
    }),
  );

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

  const maxQuarterByMatch = new Map<string, number>();
  filtered.forEach((row) => {
    const order = Number.parseInt(row.type ?? "0", 10);
    const prev = maxQuarterByMatch.get(row.match_uid!);
    if (!prev || order > prev) maxQuarterByMatch.set(row.match_uid!, order);
  });

  const existingAssigned = await prisma.assigned.findMany({
    where: { quarter: { matchClub: { legacyId: { in: legacyMatchIds } } } },
    select: { id: true, quarterId: true, attendanceId: true, teamId: true, position: true },
  });
  const assignedKeySet = new Set(existingAssigned.map((a) => `${a.quarterId}:${a.attendanceId}`));

  const toCreate: Prisma.AssignedCreateManyInput[] = [];

  for (const [matchLegacyId, matchClub] of matchClubMap.entries()) {
    const targetRows = filtered.filter((row) => row.match_uid === matchLegacyId);
    if (!targetRows.length) continue;
    const maxQuarter = maxQuarterByMatch.get(matchLegacyId) ?? 4;
    const teamIdsFromRows = new Set<string | null>();
    targetRows.forEach((row) => {
      const teamId = resolveTeamId(matchClub, row.team_name);
      teamIdsFromRows.add(teamId);
    });
    if (!teamIdsFromRows.size) teamIdsFromRows.add(null);
    const teamIds = Array.from(teamIdsFromRows);

    // ensure quarters up to maxQuarter
    for (let order = 1; order <= maxQuarter; order += 1) {
      await ensureQuarter(matchClub, order, matchClub.teams[0]?.id, matchClub.teams[1]?.id);
    }

    for (const teamId of teamIds) {
      for (let order = 1; order <= maxQuarter; order += 1) {
        const quarter = matchClub.quarters.find((q) => q.order === order);
        if (!quarter) continue;
        const existingForQuarter = existingAssigned.filter(
          (a) => a.quarterId === quarter.id && (teamId === null ? !a.teamId : a.teamId === teamId),
        );
        const emptyPositions = PORMATION_POSITIONS["4-3-3"].filter(
          (pos) => !existingForQuarter.some((a) => a.position === pos),
        );

        const attendancesForMatch = attendances.filter(
          (att) =>
            att.matchClubId === matchClub.id &&
            att.isVote &&
            att.state === "NORMAL" &&
            (teamId === null ? true : att.teamId === teamId),
        );

        const notAssigned = attendancesForMatch
          .filter((att) => !att.assigneds.some((as) => as.quarterId === quarter.id))
          .sort((a, b) => {
            const aGames = a.assigneds.filter((as) => as.position !== "GK").length;
            const bGames = b.assigneds.filter((as) => as.position !== "GK").length;
            if (aGames !== bGames) return aGames - bGames;
            const aTime = a.checkTime ? new Date(a.checkTime).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.checkTime ? new Date(b.checkTime).getTime() : Number.POSITIVE_INFINITY;
            if (aTime !== bTime) return aTime - bTime;
            const isAUser = !a.mercenaryId;
            const isBUser = !b.mercenaryId;
            return isAUser === isBUser ? 0 : isAUser ? -1 : 1;
          });

        const mutableEmpty = [...emptyPositions];
        const popNonGk = () => {
          const idx = mutableEmpty.findIndex((pos) => pos !== "GK");
          if (idx >= 0) return mutableEmpty.splice(idx, 1)[0];
          const shifted = mutableEmpty.shift();
          if (shifted) return shifted;
          return "GK" as PositionType;
        };

        for (const att of notAssigned) {
          const positions: PositionType[] = [];
          if (att.playerId) {
            const p1 = att.player?.user?.position1;
            const p2 = att.player?.user?.position2;
            const p3 = att.player?.user?.position3;
            if (p1) positions.push(p1);
            if (p2) positions.push(p2);
            if (p3) positions.push(p3);
          } else if (att.mercenaryId) {
            const m1 = att.mercenary?.position1;
            const m2 = att.mercenary?.position2;
            const m3 = att.mercenary?.position3;
            if (m1) positions.push(m1);
            if (m2) positions.push(m2);
            if (m3) positions.push(m3);
          }
          const compact = positions.filter(Boolean) as PositionType[];
          const exact = compact.find((pos) => mutableEmpty.includes(pos));
          if (exact) {
            mutableEmpty.splice(mutableEmpty.indexOf(exact), 1);
            pushAssigned(toCreate, assignedKeySet, quarter.id, teamId, att.id, exact);
            continue;
          }
          const analog = compact.find((pos) =>
            mutableEmpty.some((mep) => isDiffPosition(mep, pos)),
          );
          if (analog) {
            const matched = mutableEmpty.find((mep) => isDiffPosition(mep, analog));
            if (matched) {
              mutableEmpty.splice(mutableEmpty.indexOf(matched), 1);
              pushAssigned(toCreate, assignedKeySet, quarter.id, teamId, att.id, matched);
              continue;
            }
          }
          const rl = compact.find((pos) => mutableEmpty.some((mep) => isRLDiffPostion(mep, pos)));
          if (rl) {
            const matched = mutableEmpty.find((mep) => isRLDiffPostion(mep, rl));
            if (matched) {
              mutableEmpty.splice(mutableEmpty.indexOf(matched), 1);
              pushAssigned(toCreate, assignedKeySet, quarter.id, teamId, att.id, matched);
              continue;
            }
          }
          const fallback = popNonGk();
          pushAssigned(toCreate, assignedKeySet, quarter.id, teamId, att.id, fallback);
        }
      }
    }
  }

  if (!toCreate.length) {
    console.log("ℹ️ [assignedMigration] nothing to create");
    return;
  }

  await prisma.assigned.createMany({ data: toCreate, skipDuplicates: true });

  console.log("✅ [assignedMigration] completed", { created: toCreate.length });
};

function pushAssigned(
  toCreate: Prisma.AssignedCreateManyInput[],
  keySet: Set<string>,
  quarterId: string,
  teamId: string | null,
  attendanceId: string,
  position: PositionType,
) {
  const key = `${quarterId}:${teamId ?? "null"}:${position}`;
  if (keySet.has(key)) return;
  keySet.add(key);
  toCreate.push({
    quarterId,
    attendanceId,
    position,
    teamId,
  });
}
