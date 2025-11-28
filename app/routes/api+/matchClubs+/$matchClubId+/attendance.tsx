import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { attendanceService } from "~/features/matches/server";
import { getUser } from "~/libs/server";

const getClubIdFromRequest = (request: Request) => {
  const url = new URL(request.url);
  return url.searchParams.get("clubId");
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const clubId = getClubIdFromRequest(request);
  if (!clubId) {
    throw new Response("clubId is required", { status: 400 });
  }
  const data = await attendanceService.getAttendancePageData(user.id, clubId, matchClubId);
  return Response.json(data, "redirectTo" in data ? { status: 403 } : {});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const matchClubId = params.matchClubId;
  if (!matchClubId) {
    throw new Response("matchClubId is required", { status: 400 });
  }
  const body = await request.json();
  const clubId = body.clubId ?? getClubIdFromRequest(request);
  if (!clubId || typeof clubId !== "string") {
    throw new Response("clubId is required", { status: 400 });
  }
  const isVote = Boolean(body.isVote);
  const isCheck = Boolean(body.isCheck);
  const mercenaryId = typeof body.mercenaryId === "string" ? body.mercenaryId : undefined;
  const result = await attendanceService.submitAttendance(user.id, clubId, matchClubId, {
    isVote,
    isCheck,
    mercenaryId,
  });
  return Response.json(result, "redirectTo" in result ? { status: 400 } : {});
};
