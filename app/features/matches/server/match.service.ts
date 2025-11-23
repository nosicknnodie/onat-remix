import dayjs from "dayjs";
import { memberService } from "~/features/clubs/server";
import { prisma } from "~/libs/db/db.server";
import * as q from "./match.queries";
import { sendMatchWebhook } from "./webhook";

export async function deleteMatchClub(matchClubId: string, userId?: string | null) {
  if (!userId) {
    return { ok: false as const, status: 401, message: "로그인이 필요합니다." };
  }

  try {
    const matchClub = await q.findMatchClubWithMatch(matchClubId);
    if (!matchClub || !matchClub.match) {
      return { ok: false as const, status: 404, message: "매치를 찾을 수 없습니다." };
    }

    const membership = await prisma.player.findUnique({
      where: {
        clubId_userId: {
          clubId: matchClub.clubId,
          userId,
        },
      },
      select: { id: true, role: true },
    });

    if (!membership) {
      return { ok: false as const, status: 403, message: "클럽 멤버만 삭제할 수 있습니다." };
    }

    const permissions = await memberService.getEffectivePermissions(membership);
    const hasMatchMaster = permissions.includes("MATCH_MASTER");
    const hasMatchCreate = permissions.includes("MATCH_CREATE");
    const canDeleteByDate = dayjs(matchClub.match.stDate).diff(dayjs(), "day") >= 1;

    if (!(hasMatchMaster || (hasMatchCreate && canDeleteByDate))) {
      const reason = hasMatchCreate ? "삭제 가능 기한이 지났습니다." : "삭제 권한이 없습니다.";
      return { ok: false as const, status: 403, message: reason };
    }

    await q.deactivateMatchClub(matchClubId);
    void sendMatchWebhook({ matchClubId, action: "deleted" });
    return { ok: true as const };
  } catch (error) {
    console.error(error);
    return { ok: false as const, status: 500, message: "매치를 삭제하는 중 오류가 발생했습니다." };
  }
}
