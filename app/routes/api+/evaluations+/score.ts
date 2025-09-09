import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { rating as matches } from "~/features/matches/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData.server";

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
  const res = await matches.service.upsertScore(user.id, result.data);
  if (!res.ok) return Response.json({ error: "Internal Server Error" }, { status: 500 });
  return Response.json({ success: "success" });
};
