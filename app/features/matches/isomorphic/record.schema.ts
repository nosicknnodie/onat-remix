import type { GoalType } from "@prisma/client";
import { z } from "zod";

const goalTypeValues = ["NORMAL", "PK", "HEADER", "OWNGOAL"] as const satisfies readonly GoalType[];

export const recordSchema = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  assistAttendanceId: z.string().optional(),
  teamId: z.string().nullable().optional(),
  quarterId: z.string().min(1, "quarterId is required"),
  isOwnGoal: z.boolean().optional(),
  goalType: z.enum(goalTypeValues).optional(),
});

export type RecordSchema = z.infer<typeof recordSchema>;
