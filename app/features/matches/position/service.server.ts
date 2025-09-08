import { redis } from "~/libs/db/redis.server";
import * as q from "./queries.server";

export async function getPositionPageData(matchClubId: string) {
  const matchClub = await q.findMatchClubWithQuartersAndTeams(matchClubId);
  if (!matchClub) return null;
  return { matchClub } as const;
}

export async function getPositionSettingData(matchClubId: string) {
  const matchClub = await q.findMatchClubWithQuartersTeamsAttendances(matchClubId);
  if (!matchClub) return null;
  return { matchClub } as const;
}

export async function createQuarter(matchClubId: string, order: number) {
  try {
    await q.createQuarter(matchClubId, order);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function createAssigneds(
  items: Array<{
    attendanceId: string;
    quarterId: string;
    position: import("@prisma/client").PositionType;
    teamId?: string | null;
  }>,
) {
  const created = await Promise.all(items.map((d) => q.createAssigned(d)));
  if (created.length > 0) {
    await redis.publish(
      `position:${created[0].quarterId}`,
      JSON.stringify({ type: "POSITION_CREATED", assigneds: created }),
    );
  }
  return { ok: true as const, assigneds: created };
}

export async function updateAssigneds(
  items: Array<{
    id: string;
    attendanceId: string;
    quarterId: string;
    position: import("@prisma/client").PositionType;
    teamId?: string | null;
  }>,
) {
  const updates = await Promise.all(
    items.map((i) =>
      q.updateAssigned(i.id, {
        attendanceId: i.attendanceId,
        quarterId: i.quarterId,
        position: i.position,
        teamId: i.teamId,
      }),
    ),
  );
  if (updates.length > 0) {
    await redis.publish(
      `position:${updates[0].quarterId}`,
      JSON.stringify({ type: "POSITION_UPDATED", assigneds: updates }),
    );
  }
  return { ok: true as const, assigneds: updates };
}

export async function deleteAssigneds(items: Array<{ id: string; quarterId: string }>) {
  const deleted = await Promise.all(items.map((i) => q.deleteAssigned(i.id)));
  if (deleted.length > 0) {
    await redis.publish(
      `position:${items[0].quarterId}`,
      JSON.stringify({ type: "POSITION_REMOVED", assignedIds: deleted.map((a) => a.id) }),
    );
  }
  return { ok: true as const };
}

export async function swapAssignedPosition(
  assignedId: string,
  toPosition: import("@prisma/client").PositionType,
) {
  const current = await q.findAssignedById(assignedId);
  if (!current) return { ok: false as const, message: "assigned not found" };
  const wasAssigned = await q.findAssignedByPosition(current.quarterId, current.teamId, toPosition);
  const updates: Array<Awaited<ReturnType<typeof q.updateAssigned>>> = [];
  if (wasAssigned) {
    updates.push(
      await q.updateAssigned(wasAssigned.id, {
        attendanceId: wasAssigned.attendanceId,
        quarterId: wasAssigned.quarterId,
        position: current.position,
        teamId: wasAssigned.teamId ?? undefined,
      }),
    );
  }
  updates.push(
    await q.updateAssigned(current.id, {
      attendanceId: current.attendanceId,
      quarterId: current.quarterId,
      position: toPosition,
      teamId: current.teamId ?? undefined,
    }),
  );
  await redis.publish(
    `position:${current.quarterId}`,
    JSON.stringify({ type: "POSITION_UPDATED", assigneds: updates }),
  );
  return { ok: true as const };
}
