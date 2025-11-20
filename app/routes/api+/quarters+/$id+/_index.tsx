import type { Prisma } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { positionSerivce, recordService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const quarterId = params.id!;
  const data = await recordService.getQuarterDetail(quarterId);
  return Response.json(data);
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const quarterId = params.id;
  if (!quarterId) {
    return Response.json({ error: "quarter id is required" }, { status: 400 });
  }
  const result = await positionSerivce.deleteQuarter(quarterId);
  if (!result.ok) {
    return Response.json({ error: result.message ?? "삭제 실패" }, { status: 400 });
  }
  return Response.json({ ok: true });
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
