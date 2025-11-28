import { PositionType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { parseRequestData, prisma } from "~/libs/server";

const assignedSchema = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  quarterId: z.string().min(1, "quarterId is required"),
  position: z.nativeEnum(PositionType),
  teamId: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const res = await parseRequestData(request);
  const result = assignedSchema.safeParse(res);
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  try {
    await prisma.assigned.create({
      data: {
        position: result.data.position,
        attendanceId: result.data.attendanceId,
        quarterId: result.data.quarterId,
        teamId: result.data.teamId,
      },
    });
    return Response.json({ success: "success" });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
