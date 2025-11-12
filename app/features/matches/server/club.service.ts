import { prisma } from "~/libs/db/db.server";
import type { MatchClubSummary } from "../isomorphic/types";
import * as q from "./club.queries";
import { summarizeMatchClubs } from "./summary.service";

export async function getMatchClubLayoutData(matchClubId: string) {
  const matchClub = await q.findMatchClubWithRelations(matchClubId);
  let summary: MatchClubSummary | null = null;
  if (matchClub) {
    summary = summarizeMatchClubs([matchClub])[0] ?? null;
  }

  return { matchClub, summary };
}

export async function setIsSelf(matchClubId: string, isSelf: boolean) {
  try {
    await prisma.$transaction(async (tx) => {
      const matchClub = await tx.matchClub.findUnique({
        where: { id: matchClubId },
        include: { teams: true },
      });
      if (!matchClub) throw new Error("matchClub not found");
      if (isSelf && matchClub.teams.length < 2) {
        const before = await tx.matchClub.findFirst({
          where: { clubId: matchClub.clubId, isSelf: true },
          orderBy: { match: { stDate: "desc" } },
          include: { teams: true },
        });
        if (before?.teams && before.teams.length > 2) {
          await Promise.all(
            before.teams.map((team) =>
              tx.team.create({
                data: { name: team.name, color: team.color, matchClubId: matchClub.id },
              }),
            ),
          );
        } else {
          await Promise.all([
            tx.team.create({
              data: { name: "Team A", color: "#000000", matchClubId: matchClub.id },
            }),
            tx.team.create({
              data: { name: "Team B", color: "#ffffff", matchClubId: matchClub.id },
            }),
          ]);
        }
      }
      const teams = await tx.team.findMany({ where: { matchClubId: matchClub.id } });
      await Promise.all([
        tx.matchClub.update({ where: { id: matchClubId }, data: { isSelf } }),
        tx.quarter.updateMany({
          where: { matchClubId },
          data: {
            isSelf,
            ...(isSelf
              ? { team1Id: teams.at(0)?.id, team2Id: teams.at(1)?.id }
              : { team1Id: null, team2Id: null }),
          },
        }),
        tx.quarter.deleteMany({ where: { matchClubId, order: { gt: 4 } } }),
        tx.assigned.deleteMany({ where: { quarter: { matchClubId } } }),
      ]);
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}
