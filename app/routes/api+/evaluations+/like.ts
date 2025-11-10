import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { ratingService } from "~/features/matches/server";
import { getUser, parseRequestData } from "~/libs/index.server";

const EvaluationValidate = z.object({
  attendanceId: z.string().min(1, "attendanceId is required"),
  matchClubId: z.string().min(1, "matchClubId is required"),
  liked: z.boolean(),
});

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user)
    return Response.json(
      { ok: false, message: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  const data = await parseRequestData(request);
  const result = EvaluationValidate.safeParse(data);
  if (!result.success) {
    const flat = result.error.flatten();
    return Response.json(
      { ok: false, message: "Invalid input", code: "VALIDATION", fieldErrors: flat.fieldErrors },
      { status: 422 },
    );
  }
  const res = await ratingService.upsertLike(user.id, result.data);
  if (!res.ok)
    return Response.json(
      { ok: false, message: "Internal Server Error", code: "SERVER" },
      { status: 500 },
    );
  return Response.json({ ok: true, message: "success", success: "success" });
};
