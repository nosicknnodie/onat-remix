import { PositionType } from "@prisma/client";
import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { redis } from "~/libs/db/redis.server";
import { parseRequestData } from "~/libs/requestData";

const assignedSchema = z.object({
  assignedId: z.string().min(1, "assignedId is required"),
  toPosition: z.nativeEnum(PositionType),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const value = await parseRequestData(request);
  const result = assignedSchema.safeParse(value);

  if (!result.success) {
    return Response.json(
      { success: false, errors: result.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const assigned = await tx.assigned.findUnique({
        where: {
          id: result.data.assignedId,
        },
      });
      if (!assigned) throw new Error("assigned not found");
      const wasAssigned = await tx.assigned.findFirst({
        where: {
          position: result.data.toPosition,
          teamId: assigned.teamId,
          quarterId: assigned.quarterId,
        },
      });
      let wasAssignedUpdate = undefined;
      if (wasAssigned) {
        wasAssignedUpdate = await tx.assigned.update({
          where: { id: wasAssigned.id },
          data: {
            position: assigned.position,
          },
        });
      }
      const update = await tx.assigned.update({
        where: {
          id: result.data.assignedId,
        },
        data: {
          position: result.data.toPosition,
        },
      });
      return [update, wasAssignedUpdate];
    });
    const updateds = updated.filter(Boolean);
    await redis.publish(
      `position:${updateds?.at(0)?.quarterId}`,
      JSON.stringify({
        type: "POSITION_UPDATED",
        assigneds: updateds,
      })
    );
    // await prisma.assigned.update({
    //   where: {
    //     id: result.data.assignedId,
    //   },
    //   data: {
    //     position: result.data.toPosition,
    //   },
    // });
    return Response.json({ success: "success" });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, errors: "Internal Server Error" },
      { status: 500 }
    );
  }
};
