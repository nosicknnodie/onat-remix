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
  if (!user)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  const playerId = params.id;
  if (!playerId) {
    return Response.json(
      {
        ok: false,
        message: "playerId is required",
        code: "VALIDATION",
        fieldErrors: { id: ["required"] },
      },
      { status: 422 },
    );
  }

  const raw = await request.json();
  const result = PlayerUpdateSchema.safeParse(raw);

  if (!result.success) {
    const flat = result.error.flatten();
    return Response.json(
      { ok: false, message: "Invalid input", code: "VALIDATION", fieldErrors: flat.fieldErrors },
      { status: 422 },
    );
  }

  const existingPlayer = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!existingPlayer) {
    return Response.json(
      { ok: false, message: "Player not found", code: "NOT_FOUND" },
      { status: 404 },
    );
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
    return Response.json(
      { ok: false, message: "You are not a member of this club", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const isAllow =
    requestPlayer?.role === "MASTER" ||
    requestPlayer?.role === "MANAGER" ||
    requestPlayer?.id === existingPlayer.id;
  if (!isAllow) {
    return Response.json(
      { ok: false, message: "You don't have permission to update this player", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const parsed = result.data;
  const logs: Array<
    Partial<Omit<PlayerLog, "playerId">> &
      Pick<PlayerLog, "playerId"> & { createPlayerId?: string | null }
  > = [];

  const cleaned = _.omitBy(parsed, _.isUndefined);
  _.forEach(cleaned, (value, key) => {
    switch (key) {
      case "isInjury":
        logs.push({
          type: "INJURY",
          value: value === true ? "START" : "END",
          playerId: playerId,
          createUserId: user.id,
          createPlayerId: requestPlayer.id,
        });
        break;
      case "isRest":
        logs.push({
          type: "REST",
          value: value === true ? "START" : "END",
          playerId: playerId,
          createUserId: user.id,
          createPlayerId: requestPlayer.id,
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
          createPlayerId: requestPlayer.id,
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
          createPlayerId: requestPlayer.id,
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
          createPlayerId: requestPlayer.id,
        });
        break;
    }
  });

  if (Object.keys(cleaned).length === 0) {
    return Response.json(
      {
        ok: false,
        message: "No valid fields to update",
        code: "VALIDATION",
        fieldErrors: { formErrors: ["No valid fields to update"] },
      },
      { status: 422 },
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const txPlayer = await tx.player.update({
        where: { id: playerId },
        data: cleaned,
      });
      if (logs.length > 0) {
        await tx.playerLog.createMany({
          // biome-ignore lint/suspicious/noExplicitAny: Prisma 타입 임시 우회
          data: logs as any,
        });
      }
      return txPlayer;
    });

    return Response.json({
      ok: true,
      message: "성공적으로 수정했습니다.",
      data: { player: updated },
      success: "성공적으로 수정했습니다.",
      player: updated,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { ok: false, message: "Failed to update player", code: "SERVER" },
      { status: 500 },
    );
  }
};
