import { GoalType } from "@prisma/client";
import { z } from "zod";

export const recordSchema = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  assistAttendanceId: z.string().optional(),
  teamId: z.string().nullable().optional(),
  quarterId: z.string().min(1, "quarterId is required"),
  isOwnGoal: z.boolean().optional(),
  goalType: z.nativeEnum(GoalType).optional(),
});

export type RecordSchema = z.infer<typeof recordSchema>;
