import type { LoaderFunctionArgs } from "@remix-run/node";
import { statsService } from "~/features/clubs/server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { clubId } = params;
  if (!clubId) {
    throw new Response("clubId is required", { status: 400 });
  }

  const data = await statsService.getWeeklyTopRatingService(clubId);
  return Response.json(data);
}
