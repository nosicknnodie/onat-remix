import type { Prisma } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { recordService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const quarterId = params.id!;
  const data = await recordService.getQuarterDetail(quarterId);
  return Response.json(data);
};

export type IQuarter = Prisma.QuarterGetPayload<{
  include: {
    assigneds: {
      include: {
        team: true;
        attendance: {
          include: {
            mercenary: { include: { user: { include: { userImage: true } } } };
            player: { include: { user: { include: { userImage: true } } } };
          };
        };
      };
    };
  };
}>;
