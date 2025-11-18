import * as q from "./team.queries";

export async function getTeamPageData(matchClubId: string) {
  const matchClub = await q.findMatchClubTeams(matchClubId);
  const teams = matchClub?.teams;
  return { teams } as const;
}
