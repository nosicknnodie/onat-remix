import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { attendance as matches } from "~/features/matches/index.server";
import { getUser } from "~/libs/index.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  const data = await matches.service.getAttendancePageData(user.id, matchId!, matchClubId!);
  if ("redirectTo" in data) return redirect(data.redirectTo as string);
  return data;
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const matchId = params.id;
  const matchClubId = params.matchClubId;
  const formData = await request.formData();
  const isVote = formData.get("isVote") === "true";
  const isCheck = formData.get("isCheck") === "true";
  const mercenaryId = formData.get("mercenaryId")?.toString();

  if (!matchClubId) return redirect(`/matches/${matchId!}/clubs/${matchClubId!}`);
  const res = await matches.service.submitAttendance(user.id, matchId!, matchClubId!, {
    isVote,
    isCheck,
    mercenaryId,
  });
  if ("redirectTo" in res) return redirect(res.redirectTo as string);
  return { success: true };
};
