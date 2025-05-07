import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const clubId = params.id;

  if (!clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }
  try {
    const players = await prisma.player.findMany({
      where: {
        clubId: clubId,
      },
      include: {
        user: {
          include: {
            userImage: true,
          },
        },
      },
    });

    return Response.json({ players });
  } catch (e) {
    return Response.json({ error: e }, { status: 500 });
  }
}
