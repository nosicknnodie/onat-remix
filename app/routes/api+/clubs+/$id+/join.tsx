import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  // user check
  const user = await getUser(request);
  if (!user) return Response.json({ success: true, redirectTo: "/auth/login" });

  // club check
  const clubId = params.id;
  if (!clubId) return Response.json({ error: "clubId is required" }, { status: 400 });

  // nick check
  const raw = await request.json();
  const nick = raw.nick;
  if (!nick) {
    return Response.json({ error: "닉네임이 없습니다." }, { status: 400 });
  }

  try {
    const existingPlayer = await prisma.player.findUnique({
      where: {
        clubId_userId: {
          userId: user.id,
          clubId,
        },
      },
    });
    if (
      !existingPlayer ||
      (existingPlayer.status !== "APPROVED" && existingPlayer.status !== "PENDING")
    ) {
      const player = await prisma.player.upsert({
        where: {
          clubId_userId: {
            userId: user.id,
            clubId,
          },
        },
        update: {
          nick,
          role: "PENDING",
          status: "PENDING",
          jobTitle: "NO",
        },
        create: {
          nick,
          userId: user.id,
          clubId,
        },
      });
      await prisma.playerLog.create({
        data: {
          playerId: player.id,
          type: "STATUS",
          value: "START",
          from: existingPlayer?.status.toString() ?? null,
          to: "PENDING",
          createUserId: user.id,
        },
      });
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: "가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
  return Response.json({
    success: "가입신청 완료 했습니다.",
    redirectTo: `/clubs/${clubId}`,
  });
};
