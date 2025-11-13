import type { LoaderFunctionArgs } from "@remix-run/node";
import { positionSerivce } from "~/features/matches/server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const data = await positionSerivce.getPositionSettingMeta(matchClubId);
  if (!data) {
    throw new Response("matchClub not found", { status: 404 });
  }
  return Response.json(data);
};

export type MatchClubPositionSettingApiResponse = Awaited<ReturnType<typeof loader>>;
