import * as q from "./queries.server";

const buildRedirectPath = (clubId: string, matchClubId: string) =>
  `/clubs/${clubId}/matches/${matchClubId}`;

export async function getTeamPageData(clubId: string, matchClubId: string) {
  const matchClub = await q.findMatchClubTeamsAndAttendances(matchClubId);
  if (!matchClub || !matchClub.isSelf)
    return { redirectTo: buildRedirectPath(clubId, matchClubId) } as const;
  const teams = matchClub.teams;
  const attendances = matchClub.attendances;
  return { teams, attendances } as const;
}
