import { LoaderFunctionArgs } from "@remix-run/node";
import { getRatingAttendances } from "~/libs/queries/atttendances";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const matchClubId = url.searchParams.get("matchClubId");
  if (!matchClubId) return { error: "Unauthorized" };
  const attendances = await getRatingAttendances({ matchClubId });
  return Response.json({ attendances });
};
