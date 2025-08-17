import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

const EvaluationValidate = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  matchClubId: z.string().min(1, "matchClubId is required"),
  score: z.number(),
});

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return { error: "Unauthorized" };
  const data = await parseRequestData(request);
  const result = EvaluationValidate.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  try {
    await prisma.evaluation.upsert({
      create: { ...result.data, userId: user.id },
      update: { score: result.data.score },
      where: {
        userId_matchClubId_attendanceId: {
          userId: user.id,
          matchClubId: result.data.matchClubId,
          attendanceId: result.data.attendanceId,
        },
      },
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
