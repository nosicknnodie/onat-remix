/** biome-ignore-all lint/suspicious/noExplicitAny: off */

import type { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser, parseRequestData, prisma } from "~/libs/index.server";

const playerInclude = {
  include: {
    user: {
      include: {
        userImage: true,
      },
    },
  },
} as const;

export type IMatchClubComment = Prisma.CommentGetPayload<{
  include: {
    replyToUser: true;
    replyToPlayer: typeof playerInclude;
    replys: {
      include: {
        replyToUser: true;
        replyToPlayer: typeof playerInclude;
        player: typeof playerInclude;
        user: {
          include: {
            userImage: true;
          };
        };
      };
    };
    user: {
      include: {
        userImage: true;
      };
    };
    player: typeof playerInclude;
  };
}>;

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId!;
  const comments: IMatchClubComment[] = await prisma.comment.findMany({
    where: {
      targetId: matchClubId,
      targetType: "MATCH_CLUB",
      isDeleted: false,
      parentId: null,
    },
    include: {
      replyToUser: true,
      replyToPlayer: playerInclude,
      replys: {
        where: {
          isDeleted: false,
        },
        include: {
          replyToUser: true,
          replyToPlayer: playerInclude,
          player: playerInclude,
          user: {
            include: {
              userImage: true,
            },
          },
        },
      },
      user: {
        include: {
          userImage: true,
        },
      },
      player: playerInclude,
    },
  });
  return Response.json({ comments });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    return new Response(JSON.stringify({ error: "Missing matchClubId parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const result = await parseRequestData(request);
  const content = result.content as InputJsonValue;
  const parentId = result.parentId || null;
  const replyToUserId = result.replyToUserId || null;

  // TODO: Replace with real authentication

  try {
    const matchClub = await prisma.matchClub.findUnique({
      where: { id: matchClubId },
      select: { clubId: true },
    });
    if (!matchClub) {
      return new Response(JSON.stringify({ error: "Match club not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [currentPlayer, replyPlayer] = await Promise.all([
      prisma.player.findFirst({
        where: { clubId: matchClub.clubId, userId: user.id },
        select: { id: true },
      }),
      replyToUserId && replyToUserId !== user.id
        ? prisma.player.findFirst({
            where: { clubId: matchClub.clubId, userId: replyToUserId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const createdComment = await prisma.comment.create({
      data: {
        content,
        userId: user?.id || "",
        playerId: currentPlayer?.id ?? null,
        targetId: matchClubId,
        targetType: "MATCH_CLUB",
        parentId: parentId,
        replyToUserId: replyToUserId === user?.id ? null : replyToUserId,
        replyToPlayerId:
          replyToUserId && replyToUserId !== user?.id ? (replyPlayer?.id ?? null) : null,
      },
      include: {
        user: {
          include: {
            userImage: true,
          },
        },
        replyToUser: {
          include: {
            userImage: true,
          },
        },
        replyToPlayer: playerInclude,
        player: playerInclude,
      },
    });
    return Response.json({ comment: createdComment });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to create comment",
        detail: error?.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
