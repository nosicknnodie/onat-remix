import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { statsService } from "~/features/clubs/server";

const querySchema = z.object({
  year: z.coerce.number().int().min(1970).max(3000).default(new Date().getFullYear()),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { clubId } = params;
  if (!clubId) {
    throw new Response("clubId is required", { status: 400 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    throw new Response("Invalid query", { status: 400 });
  }

  const data = await statsService.getClubYearStatsService({ clubId, year: parsed.data.year });
  return json(data);
}
