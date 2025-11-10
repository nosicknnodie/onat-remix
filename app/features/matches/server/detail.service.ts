import type { MatchSummary } from "../isomorphic/summary.types";
import * as q from "./detail.queries";
import { summarizeMatch } from "./summary.service";

export async function getMatchDetail(matchId: string): Promise<MatchSummary | null> {
  const match = await q.findMatchByIdWithClubs(matchId);
  if (!match) return null;
  return summarizeMatch(match);
}

export async function updateMatch(
  matchId: string,
  dto: {
    title: string;
    description: string;
    stDate: Date;
    placeName?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
    createUserId: string;
  },
) {
  await q.updateMatch(matchId, {
    title: dto.title,
    description: dto.description,
    stDate: dto.stDate,
    placeName: dto.placeName ?? "",
    address: dto.address ?? "",
    lat: dto.lat ?? null,
    lng: dto.lng ?? null,
    createUserId: dto.createUserId,
  });
  return { ok: true as const };
}
