import { PositionType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { positionSerivce } from "~/features/matches/server";
import { parseRequestData } from "~/libs/requestData.server";

const slotSchema = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  quarterId: z.string().min(1, "quarterId is required"),
  position: z.nativeEnum(PositionType),
  teamId: z.string().optional().nullable(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method.toUpperCase() !== "PUT") {
    return Response.json({ success: false, errors: "Method Not Allowed" }, { status: 405 });
  }
  const data = await parseRequestData(request);
  const parsed = slotSchema.safeParse(data);
  if (!parsed.success) {
    return Response.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
  }
  const result = await positionSerivce.upsertAssignedSlot(parsed.data);
  return Response.json({ success: result.ok, assigned: result.assigned, action: result.action });
};
