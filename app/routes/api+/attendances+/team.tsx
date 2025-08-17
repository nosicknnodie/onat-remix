import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { teamId, attendanceIds } = await request.json();

  if (!teamId || !Array.isArray(attendanceIds)) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
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

  return Response.json({ success: "팀정보를 수정했습니다." });
};
