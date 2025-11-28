import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { positionSerivce } from "~/features/matches/server";
import { parseRequestData } from "~/libs/server/requestData";

const newQuarterSchema = z.object({
  matchClubId: z.string().min(1, "matchClubId is required"),
  order: z.number().min(1, "order is required"),
});
export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await parseRequestData(request);
  const result = newQuarterSchema.safeParse(data);
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }

  const res = await positionSerivce.createQuarter(result.data.matchClubId, result.data.order);
  if (!res.ok) return Response.json({ error: res.message }, { status: 400 });
  return Response.json({ success: "success" });
};
