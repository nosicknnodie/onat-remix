import * as q from "./queries.server";

export async function getTeamPageData(matchId: string, matchClubId: string) {
  const matchClub = await q.findMatchClubTeamsAndAttendances(matchClubId);
  if (!matchClub || !matchClub.isSelf)
    return { redirectTo: `/matches/${matchId}/clubs/${matchClubId}` } as const;
  const teams = matchClub.teams;
  const attendances = matchClub.attendances;
  return { teams, attendances } as const;
}
