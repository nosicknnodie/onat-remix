import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { club as matches } from "~/features/matches/index.server";

const matchClubSchema = z.object({
  isSelf: z.boolean(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const data = await request.json();
  const result = matchClubSchema.safeParse(data);
  const matchClubId = params.matchClubId;
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  const isSelf = result.data.isSelf;

  const res = await matches.service.setIsSelf(matchClubId!, isSelf);
  if (!res.ok) return Response.json({ success: false, errors: res.message }, { status: 500 });
  return Response.json({ success: "success" });
};
