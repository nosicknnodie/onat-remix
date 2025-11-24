import type { Prisma } from "@prisma/client";
import { EMPTY_MATCH_DESCRIPTION } from "../isomorphic";
import type { MatchSummary } from "../isomorphic/summary.types";
import * as q from "./detail.queries";
import { summarizeMatch } from "./summary.service";
import { sendMatchWebhook } from "./webhook";

export async function getMatchDetail(matchId: string): Promise<MatchSummary | null> {
  const match = await q.findMatchByIdWithClubs(matchId);
  if (!match) return null;
  return summarizeMatch(match);
}

export async function updateMatch(
  matchId: string,
  dto: {
    title: string;
    description: Prisma.InputJsonValue | string | null;
    stDate: Date;
    placeName?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    createUserId: string;
    createPlayerId?: string | null;
  },
) {
  const matchClubs = await q.findMatchClubIds(matchId);
  const clubIds = matchClubs.map((mc) => mc.clubId);
  const createPlayer =
    dto.createPlayerId ||
    (await q.findPlayerByUserAndClubIds(dto.createUserId, clubIds))?.id ||
    null;
  const normalizedDescription: Prisma.InputJsonValue = (() => {
    if (!dto.description) return EMPTY_MATCH_DESCRIPTION;
    if (typeof dto.description === "string") {
      try {
        return JSON.parse(dto.description) as Prisma.InputJsonValue;
      } catch {
        return dto.description;
      }
    }
    return dto.description;
  })();

  await q.updateMatch(matchId, {
    title: dto.title,
    description: normalizedDescription ?? EMPTY_MATCH_DESCRIPTION,
    stDate: dto.stDate,
    placeName: dto.placeName ?? "",
    address: dto.address ?? "",
    lat: dto.lat ?? null,
    lng: dto.lng ?? null,
    createUserId: dto.createUserId,
    createPlayerId: createPlayer,
  });
  await Promise.all(
    matchClubs.map((mc) => sendMatchWebhook({ matchClubId: mc.id, action: "updated" })),
  );
  return { ok: true as const };
}
