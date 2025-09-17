import type { MatchClubSummary, MatchClubWithSummaryRelations, MatchWithSummary } from "./types";

function getAttendanceDisplayName(
  attendance: MatchClubWithSummaryRelations["attendances"][number],
) {
  return (
    attendance.player?.user?.name ??
    attendance.player?.nick ??
    attendance.mercenary?.user?.name ??
    attendance.mercenary?.name ??
    null
  );
}

function getAttendanceImageUrl(attendance: MatchClubWithSummaryRelations["attendances"][number]) {
  return (
    attendance.player?.user?.userImage?.url ?? attendance.mercenary?.user?.userImage?.url ?? null
  );
}

function getAttendanceMemberType(
  attendance: MatchClubWithSummaryRelations["attendances"][number],
): "PLAYER" | "MERCENARY" {
  return attendance.player ? "PLAYER" : "MERCENARY";
}

type MomCandidate = NonNullable<MatchClubSummary["mom"]> & {
  scoreAverage: number | null;
  goalCount: number;
  likeCount: number;
};

function buildMomCandidate(
  attendance: MatchClubWithSummaryRelations["attendances"][number],
): MomCandidate | null {
  const name = getAttendanceDisplayName(attendance);
  if (!name) return null;

  const scoreSum = attendance.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
  const scoreAverageRaw =
    attendance.evaluations.length > 0 ? scoreSum / attendance.evaluations.length : null;
  const scoreAverage = scoreAverageRaw === null ? null : scoreAverageRaw / 20;
  const likeCount = attendance.evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.liked ? 1 : 0),
    0,
  );
  const goalCount = attendance.assigneds.reduce((sum, assigned) => {
    return sum + assigned.goals.filter((goal) => !goal.isOwnGoal).length;
  }, 0);

  if (scoreAverage === null && likeCount === 0 && goalCount === 0) {
    return null;
  }

  return {
    attendanceId: attendance.id,
    name,
    imageUrl: getAttendanceImageUrl(attendance),
    memberType: getAttendanceMemberType(attendance),
    scoreAverage,
    likeCount,
    goalCount,
  };
}

type BaseSummary = {
  matchClubId: string;
  club: MatchClubSummary["club"];
  scoredBase: number;
  ownCommitted: number;
  attendance: MatchClubSummary["attendance"];
  mom?: MatchClubSummary["mom"];
};

function buildBaseSummary(matchClub: MatchClubWithSummaryRelations): BaseSummary {
  const goals = matchClub.attendances.flatMap((attendance) =>
    attendance.assigneds.flatMap((assigned) => assigned.goals),
  );

  const scoredBase = goals.filter((goal) => !goal.isOwnGoal).length;
  const ownCommitted = goals.filter((goal) => goal.isOwnGoal).length;

  const attendanceStats = matchClub.attendances.reduce(
    (acc, attendance): MatchClubSummary["attendance"] => {
      return {
        total: acc.total + 1,
        voted: acc.voted + (attendance.isVote ? 1 : 0),
        checkedIn: acc.checkedIn + (attendance.isCheck ? 1 : 0),
      };
    },
    { total: 0, voted: 0, checkedIn: 0 },
  );

  const momCandidates = matchClub.attendances
    .map((attendance) => buildMomCandidate(attendance))
    .filter((candidate): candidate is MomCandidate => candidate !== null);

  momCandidates.sort((a, b) => {
    const scoreDiff = (b.scoreAverage ?? -1) - (a.scoreAverage ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    if (b.goalCount !== a.goalCount) return b.goalCount - a.goalCount;
    return 0;
  });

  const topCandidate = momCandidates[0];

  return {
    matchClubId: matchClub.id,
    club: {
      name: matchClub.club?.name ?? "",
      emblemUrl: matchClub.club?.emblem?.url ?? undefined,
    },
    scoredBase,
    ownCommitted,
    attendance: attendanceStats,
    mom: topCandidate ?? undefined,
  };
}

export function summarizeMatchClubs(
  matchClubs: MatchClubWithSummaryRelations[],
): MatchClubSummary[] {
  const baseSummaries = matchClubs.map((matchClub) => buildBaseSummary(matchClub));

  return baseSummaries.map((summary) => {
    const opponents = baseSummaries.filter((item) => item.matchClubId !== summary.matchClubId);
    const opponentScoredBase = opponents.reduce((sum, opponent) => sum + opponent.scoredBase, 0);
    const ownReceived = opponents.reduce((sum, opponent) => sum + opponent.ownCommitted, 0);

    return {
      matchClubId: summary.matchClubId,
      club: summary.club,
      goals: {
        scored: summary.scoredBase + ownReceived,
        conceded: opponentScoredBase + summary.ownCommitted,
        ownCommitted: summary.ownCommitted,
        ownReceived,
      },
      attendance: summary.attendance,
      mom: summary.mom,
    } satisfies MatchClubSummary;
  });
}

export function summarizeMatch(match: MatchWithSummary) {
  const summaries = summarizeMatchClubs(match.matchClubs);
  return {
    match,
    summaries,
  } as const;
}

export type MatchSummary = ReturnType<typeof summarizeMatch>;
