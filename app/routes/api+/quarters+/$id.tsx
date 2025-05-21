import { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const quarterId = params.id;

  const quarter = await prisma.quarter.findUnique({
    where: {
      id: quarterId,
    },
    include: {
      assigneds: {
        include: {
          team: true,
          attendance: {
            include: {
              mercenary: { include: { user: { include: { userImage: true } } } },
              player: { include: { user: { include: { userImage: true } } } },
            },
          },
        },
      },
    },
  });
  return Response.json({ quarter });
};
