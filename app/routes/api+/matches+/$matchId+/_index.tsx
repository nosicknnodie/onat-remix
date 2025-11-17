import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { parseUpdate } from "~/features/matches/isomorphic";
import { detailService } from "~/features/matches/server";
import { getUser, parseRequestData } from "~/libs/index.server";
import { jsonFail } from "~/utils/action.server";
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const matchId = params.matchId;
  if (!matchId) {
    throw new Response("matchId is required", { status: 400 });
  }

  const matchSummary = await detailService.getMatchDetail(matchId);
  if (!matchSummary) {
    throw new Response("Match summary not found", { status: 404 });
  }

  return Response.json(matchSummary);
};

export type MatchDetailApiResponse = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  const matchId = params.matchId;
  if (!user) {
    throw redirect("/auth/login");
  }
  if (!matchId) {
    return jsonFail("matchId is required.");
  }

  const raw = await parseRequestData(request);
  const parsed = parseUpdate(raw);
  if (!parsed.ok) return jsonFail("잘못된 요청입니다.", { formErrors: ["INVALID_INPUT"] });

  const { title, description, date, hour, minute, placeName, address, lat, lng } = parsed.data;
  const stDate = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);

  const res = await detailService.updateMatch(matchId, {
    title,
    description,
    stDate,
    placeName: placeName?.toString() ?? "",
    address: address?.toString() ?? "",
    lat: lat ? Number.parseFloat(lat) : null,
    lng: lng ? Number.parseFloat(lng) : null,
    createUserId: user.id,
  });

  if (!res.ok) return jsonFail("요청을 처리할 수 없습니다.");
  return Response.json(res);
};
