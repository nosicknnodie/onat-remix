import type { PositionType } from "@prisma/client";
import { AES, prisma } from "~/libs/server";
import type { MercenaryFormValues } from "../isomorphic";
import * as q from "./mercenaries.queries";

// const buildRedirectPath = (clubId: string, matchClubId: string) =>
//   `/clubs/${clubId}/matches/${matchClubId}`;

export async function getMercenaries(clubId: string) {
  const now = new Date();
  const [players, mercenaries, upcomingMatchClubs] = await Promise.all([
    q.findApprovedPlayersByClub(clubId),
    q.findMercenariesByClub(clubId),
    q.findUpcomingMatchClubsByClub(clubId, now),
  ]);
  const filtered = mercenaries
    .filter((mer) => !players.some((p) => p.userId === mer.userId))
    .map((mer) => {
      const attendances = upcomingMatchClubs.map((mc) => {
        const att = mc.attendances.find((a) => a.mercenaryId === mer.id);
        return {
          matchClubId: mc.id,
          isVote: att?.isVote ?? false,
          isCheck: att?.isCheck ?? false,
          matchClub: {
            match: { title: mc.match.title, stDate: mc.match.stDate },
          },
        };
      });
      return { ...mer, hp: mer.hp ? AES.decrypt(mer.hp) : null, attendances };
    });
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

type NormalizedMercenaryData = {
  name: string;
  description: string | null;
  hp: string | null;
  userId: string | null;
  position1: PositionType | null;
  position2: PositionType | null;
  position3: PositionType | null;
};

const normalizeMercenaryInput = (input: MercenaryFormValues): NormalizedMercenaryData => {
  const positions = input.positions ?? [];
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    hp: input.hp ? AES.encrypt(input.hp) : null,
    userId: input.userId?.trim() || null,
    position1: (positions[0] as PositionType | undefined) ?? null,
    position2: (positions[1] as PositionType | undefined) ?? null,
    position3: (positions[2] as PositionType | undefined) ?? null,
  };
};

export async function createMercenary(clubId: string, input: MercenaryFormValues) {
  const data = normalizeMercenaryInput(input);
  if (data.userId) {
    const existingPlayer = await q.findActivePlayerByClubAndUser(clubId, data.userId);
    if (existingPlayer) {
      return { ok: false as const, message: "이미 해당 클럽의 회원입니다." };
    }
  }
  try {
    const mercenary = await prisma.mercenary.create({
      data: {
        clubId,
        ...data,
      },
    });
    return { ok: true as const, mercenary };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "용병 생성 중 오류가 발생했습니다." };
  }
}

export async function updateMercenary(
  clubId: string,
  mercenaryId: string,
  input: MercenaryFormValues,
) {
  const existing = await q.findMercenaryById(mercenaryId);
  if (!existing || existing.clubId !== clubId) {
    return { ok: false as const, message: "존재하지 않는 용병입니다." };
  }
  const data = normalizeMercenaryInput(input);
  if (data.userId) {
    const existingPlayer = await q.findActivePlayerByClubAndUser(clubId, data.userId);
    if (existingPlayer) {
      return { ok: false as const, message: "이미 해당 클럽의 회원입니다." };
    }
  }
  try {
    const mercenary = await prisma.mercenary.update({
      where: { id: mercenaryId },
      data: {
        ...data,
      },
    });
    return { ok: true as const, mercenary };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "용병 수정 중 오류가 발생했습니다." };
  }
}
