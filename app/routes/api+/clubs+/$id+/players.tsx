import type { LoaderFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/index.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const clubId = params.id;

  if (!clubId) {
    return Response.json({ error: "clubId is required" }, { status: 400 });
  }
  try {
    const players = await service.getAllClubPlayers(clubId);
    return Response.json({ players });
  } catch (e) {
    return Response.json({ error: e }, { status: 500 });
  }
}
