import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { attendanceService } from "~/features/matches/server";
import { getUser } from "~/libs/index.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const clubId = params.clubId;
  const matchClubId = params.matchClubId;
  if (!clubId || !matchClubId) return redirect("/clubs");
  const data = await attendanceService.getAttendancePageData(user.id, clubId, matchClubId);
  if ("redirectTo" in data) return redirect(data.redirectTo as string);
  return data;
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const clubId = params.clubId;
  const matchClubId = params.matchClubId;
  const formData = await request.formData();
  const isVote = formData.get("isVote") === "true";
  const isCheck = formData.get("isCheck") === "true";
  const mercenaryId = formData.get("mercenaryId")?.toString();

  if (!clubId || !matchClubId) return redirect("/clubs");
  const res = await attendanceService.submitAttendance(user.id, clubId, matchClubId, {
    isVote,
    isCheck,
    mercenaryId,
  });
  if ("redirectTo" in res) return redirect(res.redirectTo as string);
  return Response.json({ success: true });
};
