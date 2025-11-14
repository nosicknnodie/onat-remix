import type { LoaderFunctionArgs } from "@remix-run/node";
import { recordService } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const data = await recordService.getRecordPageData(matchClubId);
  return Response.json(data);
};
