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
    return await prisma.$transaction(async (tx) => {
      const matchClub = await tx.matchClub.findUnique({
        where: {
          id: result.data.matchClubId,
        },
        include: {
          quarters: true,
          teams: true,
        },
      });

      if (matchClub?.quarters.some((quarter) => quarter.order === result.data.order)) {
        return Response.json({ error: "Quarter already exists" }, { status: 400 });
      }
      await tx.quarter.create({
        data: {
          matchClubId: result.data.matchClubId,
          isSelf: matchClub?.isSelf,
          order: result.data.order,
          ...(matchClub?.isSelf && {
            team1Id: matchClub.teams[0].id,
            team2Id: matchClub.teams[1].id,
          }),
        },
      });
      return Response.json({ success: "success" });
    });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
