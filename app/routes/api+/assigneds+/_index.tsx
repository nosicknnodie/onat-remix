import { PositionType } from "@prisma/client";
import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { parseRequestData } from "~/libs/requestData";

const assignedSchema = z.object({
  id: z.string().optional(),
  attendanceId: z.string().min(1, "attendanceId is required"),
  quarterId: z.string().min(1, "quarterId is required"),
  position: z.nativeEnum(PositionType),
  teamId: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const method = request.method.toUpperCase();
  const res = await parseRequestData(request);
  const result = assignedSchema.safeParse(res);
  // id는 수정/삭제 시 필요
  const id = res.id;

  if (["POST", "PUT", "PATCH"].includes(method) && !result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }

  try {
    if (method === "POST") {
      // 생성
      const newAssigned = await prisma.assigned.create({
        data: {
          position: result.data.position,
          attendanceId: result.data.attendanceId,
          quarterId: result.data.quarterId,
          teamId: result.data.teamId,
        },
      });
      return Response.json({ success: true, assigned: newAssigned });
    } else if (method === "PUT" || method === "PATCH") {
      // 수정
      if (!id) {
        return Response.json(
          { success: false, errors: { id: "id is required for update" } },
          { status: 400 },
        );
      }
      const updatedAssigned = await prisma.assigned.update({
        where: { id },
        data: {
          position: result.data.position,
          attendanceId: result.data.attendanceId,
          quarterId: result.data.quarterId,
          teamId: result.data.teamId,
        },
      });
      return Response.json({ success: true, assigned: updatedAssigned });
    } else if (method === "DELETE") {
      // 삭제
      if (!id) {
        return Response.json(
          { success: false, errors: { id: "id is required for delete" } },
          { status: 400 },
        );
      }
      await prisma.assigned.delete({ where: { id } });
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, errors: "Method Not Allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
