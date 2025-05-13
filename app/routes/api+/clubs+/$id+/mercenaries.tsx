import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const clubId = params.id;

  if (!clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }
  try {
    const mercenaries = await prisma.mercenary.findMany({
      where: {
        clubId: clubId,
      },
      include: {
        attendances: true,
        user: {
          include: {
            userImage: true,
          },
        },
      },
    });

    return Response.json({ mercenaries });
  } catch (e) {
    return Response.json({ error: e }, { status: 500 });
  }
}
