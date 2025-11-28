import type { LoaderFunctionArgs } from "@remix-run/node";
import * as z from "zod";
import { attendanceService } from "~/features/matches/server";
import { prisma } from "~/libs/server/db/db";
import { getUser } from "~/libs/server/db/lucia";

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
    await attendanceService.recalcMatchClubStatistics(matchClubId);
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
