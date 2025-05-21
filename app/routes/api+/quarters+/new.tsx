import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { parseRequestData } from "~/libs/requestData";

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

  try {
    await prisma.quarter.create({
      data: result.data,
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
