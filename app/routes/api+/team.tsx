import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { teamId, attendanceIds } = await request.json();

  if (!teamId || !Array.isArray(attendanceIds)) {
    return Response.json(
      {
        ok: false,
        message: "Invalid data",
        code: "VALIDATION",
        fieldErrors: { formErrors: ["Invalid data"] },
      },
      { status: 422 },
    );
  }

  // 해당 attendance에 teamId 할당
  await prisma.attendance.updateMany({
    where: {
      id: { in: attendanceIds },
    },
    data: {
      teamId,
    },
  });

  return Response.json({
    ok: true,
    message: "팀정보를 수정했습니다.",
    success: "팀정보를 수정했습니다.",
  });
};
