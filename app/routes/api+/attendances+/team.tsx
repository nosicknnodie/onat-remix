import type { ActionFunctionArgs } from "@remix-run/node";
import dayjs from "dayjs";
import * as z from "zod";
import { memberService } from "~/features/clubs/server";
import { getUser, prisma } from "~/libs/server";

const TeamAssignmentSchema = z.object({
  teamId: z.string(),
  attendanceIds: z.array(z.string().min(1)).min(1),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const payload = await request.json();
  const parsed = TeamAssignmentSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  const { teamId, attendanceIds } = parsed.data;

  const matchClub = await prisma.matchClub.findFirst({
    where: {
      isUse: true,
      teams: { some: { id: teamId } },
    },
    select: {
      id: true,
      clubId: true,
      match: { select: { stDate: true } },
    },
  });

  if (!matchClub) {
    return Response.json({ error: "팀 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const membership = await prisma.player.findUnique({
    where: {
      clubId_userId: {
        clubId: matchClub.clubId,
        userId: user.id,
      },
    },
    select: { id: true, role: true },
  });

  if (!membership) {
    return Response.json({ error: "클럽 멤버만 팀을 변경할 수 있습니다." }, { status: 403 });
  }

  const permissions = await memberService.getEffectivePermissions(membership);
  const hasPermission =
    permissions.includes("MATCH_MANAGE") || permissions.includes("MATCH_MASTER");
  const canManageByDate =
    matchClub.match?.stDate !== undefined
      ? dayjs().diff(dayjs(matchClub.match.stDate).add(3, "day"), "millisecond") <= 0
      : false;

  if (!(hasPermission && canManageByDate)) {
    return Response.json(
      {
        error: canManageByDate
          ? "팀 이동 권한이 없습니다."
          : "경기 시작 3일 이후에는 팀을 변경할 수 없습니다.",
      },
      { status: 403 },
    );
  }

  const validAttendanceCount = await prisma.attendance.count({
    where: {
      id: { in: attendanceIds },
      matchClubId: matchClub.id,
    },
  });

  if (validAttendanceCount !== attendanceIds.length) {
    return Response.json({ error: "유효하지 않은 참석자 선택입니다." }, { status: 400 });
  }

  // 해당 attendance에 teamId 할당
  await prisma.attendance.updateMany({
    where: {
      id: { in: attendanceIds },
      matchClubId: matchClub.id,
    },
    data: {
      teamId,
    },
  });

  return Response.json({ success: "팀정보를 수정했습니다." });
};
