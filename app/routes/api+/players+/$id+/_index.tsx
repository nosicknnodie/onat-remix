import { JobTitle, RoleType } from "@prisma/client";
import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";

const PlayerUpdateSchema = z.object({
  role: z.nativeEnum(RoleType).optional(),
  jobTitle: z.nativeEnum(JobTitle).optional(),
  nick: z.string().optional(),
  isInjury: z.boolean().optional(),
  isRest: z.boolean().optional(),
  isExit: z.boolean().optional(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const playerId = params.id;
  if (!playerId) {
    return Response.json({ error: "playerId is required" }, { status: 400 });
  }

  const raw = await request.json();
  const result = PlayerUpdateSchema.safeParse(raw);

  if (!result.success) {
    return Response.json(
      { error: "Invalid input", issues: result.error.issues },
      { status: 400 }
    );
  }

  const parsed = result.data;
  const updateData = {} as Record<string, string | boolean>;

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== "") {
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    return Response.json({
      success: "성공적으로 수정했습니다.",
      player: updated,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update player" }, { status: 500 });
  }
};
