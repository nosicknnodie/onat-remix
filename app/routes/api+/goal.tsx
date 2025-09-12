import { GoalType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { record as matches } from "~/features/matches/index.server";
import { parseRequestData } from "~/libs/index.server";

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
      const flat = parsed.error.flatten();
      return Response.json(
        { ok: false, message: "Invalid input", code: "VALIDATION", fieldErrors: flat.fieldErrors },
        { status: 422 },
      );
    }

    const res = await matches.service.createGoal({
      assignedId: data.assignedId,
      assistAssignedId: data.assistAssignedId,
      teamId: data.teamId,
      quarterId: data.quarterId,
      isOwnGoal: data.isOwnGoal,
      goalType: data.goalType,
    });
    if (!res.ok)
      return Response.json({ ok: false, message: "Server error", code: "SERVER" }, { status: 500 });
    return Response.json({ ok: true, message: "success", success: "success" });
  } else if (method === "DELETE") {
    const id = data.id;
    if (!id) {
      return Response.json(
        {
          ok: false,
          message: "id is required",
          code: "VALIDATION",
          fieldErrors: { id: ["required"] },
        },
        { status: 422 },
      );
    }

    const res = await matches.service.deleteGoal(id);
    if (!res.ok)
      return Response.json({ ok: false, message: "Server error", code: "SERVER" }, { status: 500 });
    return Response.json({ ok: true, message: "success", success: "success" });
  }
};
