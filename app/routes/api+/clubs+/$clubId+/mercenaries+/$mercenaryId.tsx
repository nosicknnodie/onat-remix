import type { ActionFunctionArgs } from "@remix-run/node";
import { mercenaryFormSchema } from "~/features/matches/isomorphic";
import { mercenaryService } from "~/features/matches/server";

export async function action({ request, params }: ActionFunctionArgs) {
  const clubId = params.clubId;
  const mercenaryId = params.mercenaryId;

  if (!clubId || !mercenaryId) {
    return Response.json(
      {
        ok: false,
        message: "clubId 및 mercenaryId는 필수입니다.",
        fieldErrors: { clubId: ["required"], mercenaryId: ["required"] },
      },
      { status: 422 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json(
      { ok: false, message: "잘못된 요청입니다.", fieldErrors: { body: ["invalid"] } },
      { status: 400 },
    );
  }

  const parsed = mercenaryFormSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return Response.json({ ok: false, message: "VALIDATION", fieldErrors }, { status: 422 });
  }

  const result = await mercenaryService.updateMercenary(clubId, mercenaryId, parsed.data);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
