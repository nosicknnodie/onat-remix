import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { AES } from "~/libs/crypto.utils";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  const matchClub = await prisma.matchClub.findUnique({
    where: { id: matchClubId },
    include: {
      match: true,
      club: {
        include: {
          image: true,
          emblem: true,
          mercenarys: { include: { user: { include: { userImage: true } } } },
          players: {
            where: { status: "APPROVED" },
            include: { user: { include: { userImage: true } } },
          },
        },
      },
      attendances: {
        include: {
          player: { include: { user: { include: { userImage: true } } } },
          mercenary: { include: { user: { include: { userImage: true } } } },
        },
      },
      teams: true,
    },
  });

  if (!matchClub) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  // 용병 개인정보 decrypt
  Object.assign(matchClub, {
    club: {
      ...matchClub.club,
      mercenarys: matchClub.club.mercenarys
        .filter(
          (mer) =>
            !mer.userId ||
            !matchClub.club.players
              .filter((p) => p.status === "APPROVED")
              .some((p) => p.userId === mer.userId),
        )
        .map((mer) => ({
          ...mer,
          hp: mer.hp ? AES.decrypt(mer.hp) : null,
        })),
    },
  });

  const [currentPlayer, currentMercenary] = await Promise.all([
    prisma.player.findUnique({
      where: {
        clubId_userId: {
          userId: user?.id,
          clubId: matchClub?.clubId,
        },
        status: "APPROVED",
      },
      include: {
        attendances: { where: { matchClubId: matchClubId } },
        user: {
          include: {
            userImage: true,
          },
        },
      },
    }),
    prisma.mercenary.findUnique({
      where: {
        userId_clubId: {
          userId: user?.id,
          clubId: matchClub?.clubId,
        },
        attendances: {
          some: {
            matchClubId: matchClubId,
          },
        },
      },
      include: {
        attendances: true,
        user: {
          include: {
            userImage: true,
          },
        },
      },
    }),
  ]);

  if (!currentPlayer && !currentMercenary) {
    return redirect("/matches/" + matchId + "/clubs/" + matchClubId);
  }

  const currentStatus = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isVote
        ? "ATTEND"
        : "ABSENT"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isVote
      ? "ATTEND"
      : "ABSENT";

  const currentChecked = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isCheck
        ? "CHECKED"
        : "NOT_CHECKED"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isCheck
      ? "CHECKED"
      : "NOT_CHECKED";

  return { matchClub, currentStatus, currentChecked };
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  const formData = await request.formData();
  const isVote = formData.get("isVote") === "true";
  const isCheck = formData.get("isCheck") === "true";
  const mercenaryId = formData.get("mercenaryId")?.toString();
  if (!matchClubId) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  const currentMatchClub = await prisma.matchClub.findUnique({
    where: {
      id: matchClubId,
    },
  });

  const currentPlayer = await prisma.player.findUnique({
    where: {
      clubId_userId: {
        userId: user.id,
        clubId: currentMatchClub?.clubId ?? "",
      },
    },
  });
  if (!currentPlayer) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  await prisma.attendance.upsert({
    create: {
      matchClubId,
      playerId: mercenaryId ? null : currentPlayer.id,
      mercenaryId: mercenaryId,
      isVote,
      isCheck,
    },
    update: {
      isVote,
      isCheck,
    },
    where: mercenaryId
      ? {
          matchClubId_mercenaryId: {
            matchClubId,
            mercenaryId,
          },
        }
      : {
          matchClubId_playerId: {
            matchClubId,
            playerId: currentPlayer.id,
          },
        },
  });
  return { success: true };
};
