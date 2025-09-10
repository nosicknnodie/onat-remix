/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import { PositionType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { position as matches } from "~/features/matches/index.server";
import { parseRequestData } from "~/libs/index.server";

const assignedSchema = z.object({
  assignedId: z.string().min(1, "assignedId is required"),
  toPosition: z.nativeEnum(PositionType),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const value = await parseRequestData(request);
  const result = assignedSchema.safeParse(value);

  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  const res = await matches.service.swapAssignedPosition(
    result.data.assignedId,
    result.data.toPosition,
  );
  if (!res.ok) return Response.json({ success: false }, { status: 400 });
  return Response.json({ success: "success" });
};
