import * as q from "./queries.server";

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
  description: string;
  stDate: Date;
  placeName?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  isSelf: boolean;
  createUserId: string;
}) {
  try {
    const res = await q.withTransaction(async (tx) => {
      const match = await q.createMatchTx(tx, {
        title: dto.title,
        description: dto.description,
        stDate: dto.stDate,
        placeName: dto.placeName ?? "",
        address: dto.address ?? "",
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        createUserId: dto.createUserId,
      });

      const matchClub = await q.createMatchClubTx(tx, {
        matchId: match.id,
        clubId: dto.clubId,
        isSelf: dto.isSelf,
      });

      if (dto.isSelf) {
        const beforeTeams = await q.findLatestSelfTeamsTx(tx, dto.clubId);
        if (beforeTeams && beforeTeams.length > 2) {
          await Promise.all(
            beforeTeams.map((team) =>
              q.createTeamTx(tx, { name: team.name, color: team.color, matchClubId: matchClub.id }),
            ),
          );
        } else {
          await Promise.all([
            q.createTeamTx(tx, { name: "Team A", color: "#000000", matchClubId: matchClub.id }),
            q.createTeamTx(tx, { name: "Team B", color: "#ffffff", matchClubId: matchClub.id }),
          ]);
        }
      }

      const teams = await q.findTeamsByMatchClubTx(tx, matchClub.id);
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

      return match;
    });
    return { ok: true as const, id: res.id };
  } catch (e) {
    console.error("[matches:createMatch] error - ", e);
    return { ok: false as const, message: "Internal Server Error" };
  }
}
