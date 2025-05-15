import { LoaderFunctionArgs } from "@remix-run/node";
import z from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

const AttendanceValidate = z.object({
  isVote: z.boolean().optional(),
  isCheck: z.boolean().optional(),
  mercenaryId: z.string(),
  matchClubId: z.string(),
});

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return { error: "Unauthorized" };
  const raw = await request.json();
  const result = AttendanceValidate.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  const { mercenaryId, matchClubId } = result.data;
  try {
    await prisma.attendance.upsert({
      create: result.data,
      update: result.data,
      where: {
        matchClubId_mercenaryId: {
          matchClubId: matchClubId,
          mercenaryId: mercenaryId,
        },
      },
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
  // const formData = await request.formData();
  // const isVote = formData.get("isVote") === "true";
  // const isCheck = formData.get("isCheck") === "true";
  // const mercenaryId = formData.get("mercenaryId")?.toString();
  // if (!matchClubId) return { error: "Unauthorized" };

  // const currentMatchClub = await prisma.matchClub.findUnique({
  //   where: {
  //     id: matchClubId,
  //   },
  // });

  // const currentPlayer = await prisma.player.findUnique({
  //   where: {
  //     clubId_userId: {
  //       userId: user.id,
  //       clubId: currentMatchClub?.clubId ?? "",
  //     },
  //   },
  // });
  // if (!currentPlayer) return redirect("/matches/" + matchId + "/clubs/" + matchClubId);

  // await prisma.attendance.upsert({
  //   create: {
  //     matchClubId,
  //     playerId: mercenaryId ? null : currentPlayer.id,
  //     mercenaryId: mercenaryId,
  //     isVote,
  //     isCheck,
  //   },
  //   update: {
  //     isVote,
  //     isCheck,
  //   },
  //   where: mercenaryId
  //     ? {
  //         matchClubId_mercenaryId: {
  //           matchClubId,
  //           mercenaryId,
  //         },
  //       }
  //     : {
  //         matchClubId_playerId: {
  //           matchClubId,
  //           playerId: currentPlayer.id,
  //         },
  //       },
  // });
  // return { success: true };
};
