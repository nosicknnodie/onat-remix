import * as q from "./queries.server";

export async function getRecordPageData(matchClubId: string) {
  const quarters = await q.getQuartersWithGoals(matchClubId);
  return { quarters } as const;
}

export async function getQuarterDetail(quarterId: string) {
  const quarter = await q.getQuarterDetail(quarterId);
  return { quarter } as const;
}

export async function createGoal(input: {
  assignedId: string;
  assistAssignedId?: string;
  teamId?: string;
  quarterId: string;
  isOwnGoal?: boolean;
  goalType?: import("@prisma/client").GoalType;
}) {
  await q.createGoal(input);
  return { ok: true as const };
}

export async function deleteGoal(id: string) {
  await q.deleteGoal(id);
  return { ok: true as const };
}
