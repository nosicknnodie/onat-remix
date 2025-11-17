import * as q from "./team.queries";

export async function getTeamPageData(clubId: string, matchClubId: string) {
  const matchClub = await q.findMatchClubTeams(matchClubId);
  const teams = matchClub?.teams;
  return { teams } as const;
}
