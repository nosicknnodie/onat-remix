import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { MatchClubQueryResponse } from "~/features/matches/isomorphic";
import { clubService, matchService } from "~/features/matches/server";
import { getUser } from "~/libs/server/db/lucia";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }

  const matchClubData = await clubService.getMatchClubLayoutData(matchClubId);
  if (!matchClubData.matchClub) {
    throw new Response("Match club not found", { status: 404 });
  }

  const payload: MatchClubQueryResponse = matchClubData;
  return Response.json(payload);
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "DELETE") {
    return Response.json({ ok: false, message: "Method not allowed" }, { status: 405 });
  }

  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    return Response.json({ ok: false, message: "matchClubId is required" }, { status: 400 });
  }

  const result = await matchService.deleteMatchClub(matchClubId, user.id);
  if (!result.ok) {
    return Response.json(result, { status: result.status ?? 500 });
  }
  return Response.json(result);
};

export type MatchClubDetailApiResponse = Awaited<ReturnType<typeof loader>>;
