import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { parseRequestData } from "~/libs/requestData.server";

const updateTeamSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다."),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "유효한 색상 코드여야 합니다."),
  seq: z.coerce.number().int().min(0, "순서는 0 이상의 정수여야 합니다.").optional(),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const teamId = params.id;
  const rawData = await parseRequestData(request);
  const result = updateTeamSchema.safeParse(rawData);
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }

  const { name, color, seq } = result.data;

  try {
    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name,
        color,
        seq,
      },
    });
    return Response.json({ success: "팀정보를 수정했습니다." });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
};
