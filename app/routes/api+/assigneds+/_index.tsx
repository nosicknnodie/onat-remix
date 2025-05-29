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
      const created = await prisma.$transaction(
        parsedData.map((p) => prisma.assigned.create({ data: p.data! })),
      );
      return Response.json({ success: true, assigned: created });
    } else if (method === "PUT" || method === "PATCH") {
      const updates = await prisma.$transaction(
        parsedData.map((p) => {
          const item = isArray ? res[parsedData.indexOf(p)] : res;
          if (!item.id) throw new Error("id is required for update");
          return prisma.assigned.update({
            where: { id: item.id },
            data: p.data!,
          });
        }),
      );
      return Response.json({ success: true, assigned: updates });
    } else if (method === "DELETE") {
      // 삭제
      const id = res.id;
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
