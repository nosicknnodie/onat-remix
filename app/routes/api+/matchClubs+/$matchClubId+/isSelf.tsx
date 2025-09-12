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
    const flat = result.error.flatten();
    return Response.json(
      { ok: false, message: "Invalid input", code: "VALIDATION", fieldErrors: flat.fieldErrors },
      { status: 422 },
    );
  }
  const isSelf = result.data.isSelf;

  const res = await matches.service.setIsSelf(matchClubId!, isSelf);
  if (!res.ok)
    return Response.json({ ok: false, message: res.message, code: "SERVER" }, { status: 500 });
  return Response.json({ ok: true, message: "success", success: "success" });
};
