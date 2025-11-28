import type { ActionFunctionArgs } from "@remix-run/node";
import { positionSerivce } from "~/features/matches/server";
import { getUser, parseRequestData } from "~/libs/index.server";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await parseRequestData(request);
  const teamId = data.teamId as string | null;
  const quarterId = data.quarterId;
  if (!quarterId) return Response.json({ error: "Quarter Id is required" }, { status: 400 });
  // 리셋할때 있어야할것.
  const result = await positionSerivce.resetPosition(quarterId, teamId);

  return Response.json(result);
};
