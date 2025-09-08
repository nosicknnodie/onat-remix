import { GoalType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { record as matches } from "~/features/matches/index.server";
import { parseRequestData } from "~/libs/requestData";

const goalSchema = z.object({
  assignedId: z.string().min(1, "goalId is required"),
  assistAssignedId: z.string().optional(),
  teamId: z.string().optional(),
  quarterId: z.string().min(1, "quarterId is required"),
  isOwnGoal: z.boolean().optional(),
  goalType: z.nativeEnum(GoalType).optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await parseRequestData(request);
  const method = request.method.toUpperCase();
  if (method === "POST") {
    const parsed = goalSchema.safeParse(data);
    if (!parsed.success) {
      return Response.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const res = await matches.service.createGoal({
      assignedId: data.assignedId,
      assistAssignedId: data.assistAssignedId,
      teamId: data.teamId,
      quarterId: data.quarterId,
      isOwnGoal: data.isOwnGoal,
      goalType: data.goalType,
    });
    if (!res.ok) return Response.json({ success: false }, { status: 500 });
    return Response.json({ success: "success" });
  } else if (method === "DELETE") {
    const id = data.id;
    if (!id) {
      return Response.json({ success: false, errors: "id is required" }, { status: 400 });
    }

    const res = await matches.service.deleteGoal(id);
    if (!res.ok) return Response.json({ success: false }, { status: 500 });
    return Response.json({ success: "success" });
  }
};
