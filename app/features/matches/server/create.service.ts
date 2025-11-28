import type { Prisma } from "@prisma/client";
import { EMPTY_MATCH_DESCRIPTION } from "../isomorphic";
import * as q from "./create.queries";
import { sendMatchWebhook } from "./webhook";

export async function getMatchData(userId: string, clubId: string) {
  const club = await q.getManagerClub(userId, clubId);
  return { club };
}

export async function getNewMatchData(userId: string) {
  const clubs = await q.getManagerClubs(userId);
  return { clubs };
}

export async function createMatch(dto: {
  clubId: string;
  title: string;
  description: Prisma.InputJsonValue | string | null;
  stDate: Date;
  placeName?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  isSelf: boolean;
  createUserId: string;
}) {
  try {
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
    const res = await q.withTransaction(async (tx) => {
      const createPlayer = await tx.player.findFirst({
        where: { userId: dto.createUserId, clubId: dto.clubId },
      });
      const match = await q.createMatchTx(tx, {
        title: dto.title,
        description: normalizedDescription ?? EMPTY_MATCH_DESCRIPTION,
        stDate: dto.stDate,
        placeName: dto.placeName ?? "",
        address: dto.address ?? "",
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        createUserId: dto.createUserId,
        createPlayerId: createPlayer?.id ?? null,
      });

      const matchClub = await q.createMatchClubTx(tx, {
        matchId: match.id,
        clubId: dto.clubId,
        isSelf: dto.isSelf,
      });

      let teams: { id: string; name: string; color: string }[] = [];
      if (dto.isSelf) {
        const beforeTeams = await q.findLatestSelfTeamsTx(tx, dto.clubId);
        if (beforeTeams && beforeTeams.length > 2) {
          teams = await Promise.all(
            beforeTeams.map((team) =>
              q.createTeamTx(tx, { name: team.name, color: team.color, matchClubId: matchClub.id }),
            ),
          );
        } else {
          teams = await Promise.all([
            q.createTeamTx(tx, { name: "Team A", color: "#000000", matchClubId: matchClub.id }),
            q.createTeamTx(tx, { name: "Team B", color: "#ffffff", matchClubId: matchClub.id }),
          ]);
        }
      }

      // const teams = await q.findTeamsByMatchClubTx(tx, matchClub.id);
      if (dto.isSelf && teams.length < 2) throw new Error("팀 생성 실패");

      await Promise.all(
        [1, 2, 3, 4].map((num) =>
          q.createQuarterTx(tx, {
            order: num,
            matchClubId: matchClub.id,
            isSelf: dto.isSelf,
            ...(dto.isSelf && teams[0] && teams[1]
              ? { team1Id: teams[0].id, team2Id: teams[1].id }
              : {}),
          }),
        ),
      );

      return { match, matchClub };
    });
    void sendMatchWebhook({ matchClubId: res.matchClub.id, action: "created" });
    return { ok: true as const, id: res.match.id, matchClubId: res.matchClub.id };
  } catch (e) {
    console.error("[matches:createMatch] error - ", e);
    return { ok: false as const, message: "Internal Server Error" };
  }
}
