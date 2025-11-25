import { recalcPlayerStatsHistoryByAttendance } from "./rating.queries";
import * as q from "./record.queries";

export async function getRecordPageData(matchClubId: string) {
  const quarters = await q.getQuartersWithRecords(matchClubId);
  return { quarters } as const;
}

export async function getQuarterDetail(quarterId: string) {
  const quarter = await q.getQuarterDetail(quarterId);
  return { quarter } as const;
}

export async function createGoal(input: {
  attendanceId: string;
  assistAttendanceId?: string;
  teamId?: string;
  quarterId: string;
  isOwnGoal?: boolean;
  goalType?: import("@prisma/client").GoalType;
}) {
  await q.createRecord(input);
  await Promise.all([
    recalcPlayerStatsHistoryByAttendance(input.attendanceId),
    input.assistAttendanceId
      ? recalcPlayerStatsHistoryByAttendance(input.assistAttendanceId)
      : Promise.resolve(),
  ]);
  return { ok: true as const };
}

export async function deleteGoal(id: string) {
  const record = await q.findRecordById(id);
  await q.deleteRecord(id);
  await Promise.all(
    [
      record?.attendanceId ? recalcPlayerStatsHistoryByAttendance(record.attendanceId) : undefined,
      record?.assistAttendanceId
        ? recalcPlayerStatsHistoryByAttendance(record.assistAttendanceId)
        : undefined,
    ].filter(Boolean) as Promise<unknown>[],
  );
  return { ok: true as const };
}
