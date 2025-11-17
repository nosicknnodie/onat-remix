import type { LoaderFunctionArgs } from "@remix-run/node";
import { memberService } from "~/features/clubs/server";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

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

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      role: true,
      clubId: true,
    },
  });

  if (!player) {
    return Response.json({ ok: false, message: "Player not found" }, { status: 404 });
  }

  const requesterMembership = await prisma.player.findUnique({
    where: {
      clubId_userId: {
        clubId: player.clubId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!requesterMembership) {
    return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const permissions = await memberService.getEffectivePermissions(player);
    return Response.json(permissions);
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, message: "Failed to load permissions" }, { status: 500 });
  }
};
