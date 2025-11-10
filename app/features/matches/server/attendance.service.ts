import { AES } from "~/libs/index.server";
import * as q from "./attendance.queries";

const buildRedirectPath = (clubId: string, matchClubId: string) =>
  `/clubs/${clubId}/matches/${matchClubId}`;

export async function getAttendancePageData(userId: string, clubId: string, matchClubId: string) {
  const matchClub = await q.findMatchClubWithRelations(matchClubId);
  if (!matchClub) return { redirectTo: buildRedirectPath(clubId, matchClubId) } as const;

  const filteredMercenaries: typeof matchClub.club.mercenarys = matchClub.club.mercenarys
    .filter(
      (mer) =>
        !mer.userId ||
        !matchClub.club.players
          .filter((p) => p.status === "APPROVED")
          .some((p) => p.userId === mer.userId),
    )
    .map((mer) => ({ ...mer, hp: mer.hp ? AES.decrypt(mer.hp) : null }));
  const clubWithMaskedMercs: typeof matchClub.club = {
    ...matchClub.club,
    mercenarys: filteredMercenaries,
  };

  const [currentPlayer, currentMercenary] = await Promise.all([
    q.findApprovedPlayerWithUserAndAttendance(userId, matchClub.clubId, matchClubId),
    q.findMercenaryByUserInClubWithAttendance(userId, matchClub.clubId, matchClubId),
  ]);
  if (!currentPlayer && !currentMercenary)
    return { redirectTo: buildRedirectPath(clubId, matchClubId) } as const;

  const currentStatus = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isVote
        ? "ATTEND"
        : "ABSENT"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isVote
      ? "ATTEND"
      : "ABSENT";

  const currentChecked = currentPlayer
    ? currentPlayer.attendances?.at(0)
      ? currentPlayer.attendances?.at(0)?.isCheck
        ? "CHECKED"
        : "NOT_CHECKED"
      : "PENDING"
    : currentMercenary?.attendances?.at(0)?.isCheck
      ? "CHECKED"
      : "NOT_CHECKED";

  return {
    matchClub: { ...matchClub, club: clubWithMaskedMercs },
    currentStatus,
    currentChecked,
  } as const;
}

export async function submitAttendance(
  userId: string,
  clubId: string,
  matchClubId: string,
  args: { isVote: boolean; isCheck: boolean; mercenaryId?: string | null },
) {
  const current = await q.findMatchClubWithRelations(matchClubId);
  if (!current) return { redirectTo: buildRedirectPath(clubId, matchClubId) } as const;
  const currentPlayer = await q.findApprovedPlayerWithUserAndAttendance(
    userId,
    current.clubId,
    matchClubId,
  );
  if (!currentPlayer) return { redirectTo: buildRedirectPath(clubId, matchClubId) } as const;
  await q.upsertAttendance({
    matchClubId,
    playerId: args.mercenaryId ? null : currentPlayer.id,
    mercenaryId: args.mercenaryId ?? undefined,
    isVote: args.isVote,
    isCheck: args.isCheck,
  });
  return { ok: true as const };
}
