import { GoalType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
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

    try {
      await prisma.goal.create({
        data: {
          assignedId: data.assignedId,
          assistAssignedId: data.assistAssignedId,
          teamId: data.teamId,
          quarterId: data.quarterId,
          isOwnGoal: data.isOwnGoal,
          goalType: data.goalType,
        },
      });
      return Response.json({ success: "success" });
    } catch (error) {
      console.error(error);
      return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
    }
  } else if (method === "DELETE") {
    const id = data.id;
    if (!id) {
      return Response.json({ success: false, errors: "id is required" }, { status: 400 });
    }

    try {
      await prisma.goal.delete({
        where: {
          id,
        },
      });
      return Response.json({ success: "success" });
    } catch (error) {
      console.error(error);
      return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
    }
  }
};
