import { JobTitle, type PlayerLog, RoleType, StatusType } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

const PlayerUpdateSchema = z.object({
  role: z.nativeEnum(RoleType).optional(),
  jobTitle: z.nativeEnum(JobTitle).optional(),
  nick: z.string().optional(),
  isInjury: z.boolean().optional(),
  isRest: z.boolean().optional(),
  status: z.nativeEnum(StatusType).optional(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const playerId = params.id;
  if (!playerId) {
    return Response.json({ error: "playerId is required" }, { status: 400 });
  }

  const raw = await request.json();
  const result = PlayerUpdateSchema.safeParse(raw);

  if (!result.success) {
    return Response.json({ error: "Invalid input", issues: result.error.issues }, { status: 400 });
  }

  const existingPlayer = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!existingPlayer) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  const requestPlayer = await prisma.player.findUnique({
    where: {
      clubId_userId: {
        userId: user.id,
        clubId: existingPlayer.clubId,
      },
    },
  });
  if (!requestPlayer) {
    return Response.json({ error: "You are not a member of this club" }, { status: 403 });
  }

  const isAllow =
    requestPlayer?.role === "MASTER" ||
    requestPlayer?.role === "MANAGER" ||
    requestPlayer?.id === existingPlayer.id;
  if (!isAllow) {
    return Response.json(
      { error: "You don't have permission to update this player" },
      { status: 403 },
    );
  }

  const parsed = result.data;
  const logs: (Partial<Omit<PlayerLog, "playerId">> & Pick<PlayerLog, "playerId">)[] = [];

  const cleaned = _.omitBy(parsed, _.isUndefined);
  _.forEach(cleaned, (value, key) => {
    switch (key) {
      case "isInjury":
        logs.push({
          type: "INJURY",
          value: value === true ? "START" : "END",
          playerId: playerId,
          createUserId: user.id,
        });
        break;
      case "isRest":
        logs.push({
          type: "REST",
          value: value === true ? "START" : "END",
          playerId: playerId,
          createUserId: user.id,
        });
        break;
      case "role":
        logs.push({
          type: "ROLE",
          value: "CHANGED",
          from: existingPlayer?.role,
          to: value?.toString(),
          playerId: playerId,
          createUserId: user.id,
        });
        break;
      case "jobTitle":
        logs.push({
          type: "JOB_TITLE",
          value: "CHANGED",
          from: existingPlayer?.jobTitle,
          to: value?.toString(),
          playerId: playerId,
          createUserId: user.id,
        });
        break;
      case "status":
        logs.push({
          type: "STATUS",
          value: "CHANGED",
          from: existingPlayer?.status,
          to: value?.toString(),
          playerId: playerId,
          createUserId: user.id,
        });
        break;
    }
  });

  if (Object.keys(cleaned).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const txPlayer = await tx.player.update({
        where: { id: playerId },
        data: cleaned,
      });
      if (logs.length > 0) {
        await tx.playerLog.createMany({
          data: logs,
        });
      }
      return txPlayer;
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
