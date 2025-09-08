import { AES } from "~/libs/crypto.utils";
import * as q from "./queries.server";

export async function getMercenaries(matchId: string, matchClubId: string) {
  const matchClub = await q.findMatchClubById(matchClubId);
  if (!matchClub) return { redirectTo: `/matches/${matchId}/clubs/${matchClubId}` } as const;
  const [players, mercenaries] = await Promise.all([
    q.findApprovedPlayersByClub(matchClub.clubId),
    q.findMercenariesByClub(matchClub.clubId),
  ]);
  const filtered = mercenaries
    .filter((mer) => !players.some((p) => p.userId === mer.userId))
    .map((mer) => ({ ...mer, hp: mer.hp ? AES.decrypt(mer.hp) : null }));
  return { mercenaries: filtered } as const;
}
