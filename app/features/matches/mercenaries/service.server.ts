import type { PositionType } from "@prisma/client";
import { AES, prisma } from "~/libs/index.server";
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

export async function getMatchClub(matchClubId: string) {
  return await q.findMatchClubById(matchClubId);
}

export async function findUserForMercenaryByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      position1: true,
      position2: true,
      position3: true,
    },
  });
}

export async function createMercenaryForMatchClub(input: {
  matchClubId: string;
  name: string | null;
  description: string | null;
  hp: string | null;
  userId: string | null;
  position1: PositionType | null;
  position2: PositionType | null;
  position3: PositionType | null;
}) {
  const matchClub = await q.findMatchClubById(input.matchClubId);
  if (!matchClub) return null;
  if (!input.name) return null;
  return await prisma.mercenary.create({
    data: {
      clubId: matchClub.clubId,
      name: input.name,
      description: input.description,
      position1: input.position1 || null,
      position2: input.position2 || null,
      position3: input.position3 || null,
      hp: input.hp ? AES.encrypt(input.hp) : null,
      userId: input.userId || null,
    },
  });
}
