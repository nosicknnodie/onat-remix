import type { ActionFunctionArgs } from "@remix-run/node";
import { recordSchema } from "~/features/matches/isomorphic";
import { recordService } from "~/features/matches/server";
import { parseRequestData } from "~/libs/server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await parseRequestData(request);
  const method = request.method.toUpperCase();
  if (method === "POST") {
    const parsed = recordSchema.safeParse(data);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return Response.json(
        { ok: false, message: "Invalid input", code: "VALIDATION", fieldErrors: flat.fieldErrors },
        { status: 422 },
      );
    }

    const res = await recordService.createGoal({
      attendanceId: data.attendanceId,
      assistAttendanceId: data.assistAttendanceId,
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

    const res = await recordService.deleteGoal(id);
    if (!res.ok)
      return Response.json({ ok: false, message: "Server error", code: "SERVER" }, { status: 500 });
    return Response.json({ ok: true, message: "success", success: "success" });
  }
};
