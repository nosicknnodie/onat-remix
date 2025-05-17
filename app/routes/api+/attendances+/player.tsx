import { LoaderFunctionArgs } from "@remix-run/node";
import z from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

const AttendanceValidate = z.object({
  isVote: z.boolean().optional(),
  isCheck: z.boolean().optional(),
  playerId: z.string(),
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
  const { playerId, matchClubId } = result.data;
  try {
    await prisma.attendance.upsert({
      create: result.data,
      update: result.data,
      where: {
        matchClubId_playerId: {
          matchClubId: matchClubId,
          playerId: playerId,
        },
      },
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
