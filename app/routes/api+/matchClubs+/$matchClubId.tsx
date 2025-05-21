import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";

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

  try {
    await prisma.matchClub.update({
      where: {
        id: matchClubId,
      },
      data: {
        isSelf: result.data.isSelf,
      },
    });
    return Response.json({ success: "success" });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
