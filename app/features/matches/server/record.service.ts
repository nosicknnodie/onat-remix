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
  return { ok: true as const };
}

export async function deleteGoal(id: string) {
  await q.deleteRecord(id);
  return { ok: true as const };
}
