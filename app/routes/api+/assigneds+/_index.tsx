import { PositionType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { positionSerivce } from "~/features/matches/server";
import { parseRequestData } from "~/libs/server/requestData";

const assignedSchema = z.object({
  id: z.string().optional(),
  attendanceId: z.string().min(1, "attendanceId is required"),
  quarterId: z.string().min(1, "quarterId is required"),
  position: z.nativeEnum(PositionType),
  teamId: z.string().optional().nullable(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const method = request.method.toUpperCase();
  const res = await parseRequestData(request);
  const isArray = Array.isArray(res);
  const parsedData = isArray
    ? res.map((item: z.infer<typeof assignedSchema>) => assignedSchema.safeParse(item))
    : [assignedSchema.safeParse(res)];
  const hasErrors = parsedData.some((p) => !p.success);
  if (["POST", "PUT", "PATCH"].includes(method) && hasErrors) {
    return Response.json(
      {
        success: false,
        errors: parsedData
          .filter((p) => !p.success)
          .map((p) => (p.success ? null : p.error.flatten())),
      },
      { status: 400 },
    );
  }

  try {
    if (method === "POST") {
      const created = await positionSerivce.createAssigneds(parsedData.map((p) => p.data!));
      return Response.json({ success: true, assigned: created.assigneds });
    } else if (method === "PUT" || method === "PATCH") {
      const items = parsedData.map((p) => {
        const raw = isArray ? res[parsedData.indexOf(p)] : res;
        return { id: raw.id as string, ...p.data! };
      });
      const updated = await positionSerivce.updateAssigneds(items);
      return Response.json({ success: true, assigned: updated.assigneds });
    } else if (method === "DELETE") {
      const data = parsedData.map((p) => p.data);
      const ids = data.filter((p) => p?.id).map((p) => p!.id!);
      if (ids.length === 0) {
        return Response.json(
          { success: false, errors: { id: "id is required for delete" } },
          { status: 400 },
        );
      }
      await positionSerivce.deleteAssigneds(
        ids.map((id) => ({ id, quarterId: data.at(0)!.quarterId! })),
      );
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, errors: "Method Not Allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
