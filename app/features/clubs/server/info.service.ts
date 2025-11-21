import dayjs from "dayjs";
import type { MatchWithSummary } from "~/features/matches/isomorphic";
import { summaryService } from "~/features/matches/server";
import type { ClubInfoData, ClubLeaderboardItem, ClubMatchHighlight } from "../isomorphic";
import {
  countAnnualAttendance,
  findAnnualEvaluations,
  findAnnualGoals,
  findClubById,
  findPlayerMembership,
  findRecentMatchForClub,
  findRecentNotices,
  findUpcomingMatchForClub,
} from "./queries";

type AttendanceWithMember = Awaited<ReturnType<typeof findAnnualGoals>>[number]["attendance"];

function extractMember(attendance: AttendanceWithMember | null | undefined) {
  if (!attendance) return null;
  if (attendance.player) {
    return {
      id: attendance.player.id,
      name: attendance.player.user?.name ?? attendance.player.nick ?? "",
      imageUrl: attendance.player.user?.userImage?.url ?? undefined,
      memberType: "PLAYER" as const,
    };
  }
  if (attendance.mercenary) {
    return {
      id: attendance.mercenary.id,
      name: attendance.mercenary.user?.name ?? attendance.mercenary.name ?? "",
      imageUrl: attendance.mercenary.user?.userImage?.url ?? undefined,
      memberType: "MERCENARY" as const,
    };
  }
  return null;
}

function mapGoalsToLeaders(
  goals: Awaited<ReturnType<typeof findAnnualGoals>>,
): ClubLeaderboardItem[] {
  const map = new Map<string, ClubLeaderboardItem & { count: number }>();
  goals.forEach((goal) => {
    const member = extractMember(goal.attendance);
    if (!member || !member.name) return;
    const key = `${member.memberType}-${member.id}`;
    const existing = map.get(key) ?? {
      id: member.id,
      name: member.name,
      imageUrl: member.imageUrl,
      memberType: member.memberType,
      value: 0,
      formattedValue: "0",
      count: 0,
    };
    const nextCount = existing.count + 1;
    map.set(key, {
      ...existing,
      value: nextCount,
      formattedValue: String(nextCount),
      count: nextCount,
    });
  });
  return Array.from(map.values())
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map(({ count, ...item }) => item);
}

function mapEvaluationsToLeaders(
  evaluations: Awaited<ReturnType<typeof findAnnualEvaluations>>,
): ClubLeaderboardItem[] {
  type MemberInfo = NonNullable<ReturnType<typeof extractMember>>;
  const map = new Map<string, { member: MemberInfo; sum: number; count: number }>();
  evaluations.forEach((evaluation) => {
    const member = extractMember(evaluation.attendance);
    if (!member || !member.name) return;
    const safeMember: MemberInfo = member;
    const key = `${safeMember.memberType}-${safeMember.id}`;
    const existing = map.get(key) ?? { member: safeMember, sum: 0, count: 0 };
    map.set(key, {
      member: safeMember,
      sum: existing.sum + evaluation.score,
      count: existing.count + 1,
    });
  });

  return Array.from(map.values())
    .map(({ member, sum, count }) => {
      const averageRaw = count > 0 ? sum / count : 0;
      const average = averageRaw / 20;
      return {
        id: member.id,
        name: member.name,
        imageUrl: member.imageUrl,
        memberType: member.memberType,
        value: average,
        formattedValue: average.toFixed(1),
      } satisfies ClubLeaderboardItem;
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, 5);
}

const MATCH_REF_DATE = () => new Date();

function toMatchHighlight(match: MatchWithSummary | null | undefined, clubId: string) {
  if (!match) return null;
  const { summaries } = summaryService.summarizeMatch(match);
  const matchClubIndex = match.matchClubs.findIndex((mc) => mc.clubId === clubId);
  if (matchClubIndex < 0) return null;
  const summary = summaries[matchClubIndex];
  if (!summary) return null;
  const matchClub = match.matchClubs[matchClubIndex];
  const opponents = match.matchClubs
    .filter((mc) => mc.clubId !== clubId)
    .map((mc) => ({ clubName: mc.club?.name ?? "" }));

  return {
    matchId: match.id,
    matchClubId: matchClub.id,
    title: match.title,
    stDate: match.stDate.toISOString(),
    placeName: match.placeName,
    summary,
    opponents,
  } satisfies ClubMatchHighlight;
}

function getAnnualRange(referenceDate: Date) {
  const ref = dayjs(referenceDate);
  return {
    start: ref.startOf("year").toDate(),
    end: ref.endOf("year").toDate(),
  };
}

export async function getRecentMatchHighlight(clubId: string, referenceDate = MATCH_REF_DATE()) {
  const match = await findRecentMatchForClub(clubId, referenceDate);
  return toMatchHighlight(match, clubId);
}

export async function getUpcomingMatchHighlight(clubId: string, referenceDate = MATCH_REF_DATE()) {
  const match = await findUpcomingMatchForClub(clubId, referenceDate);
  return toMatchHighlight(match, clubId);
}

export async function getAttendanceSummary(
  clubId: string,
  referenceDate = MATCH_REF_DATE(),
): Promise<ClubInfoData["attendance"]> {
  const { start, end } = getAnnualRange(referenceDate);
  const attendanceCounts = await countAnnualAttendance({ clubId, start, end });
  const attendanceRate =
    attendanceCounts.total === 0 ? 0 : attendanceCounts.checkedIn / attendanceCounts.total;
  const voteRate =
    attendanceCounts.total === 0 ? 0 : attendanceCounts.voted / attendanceCounts.total;

  return {
    total: attendanceCounts.total,
    voted: attendanceCounts.voted,
    checkedIn: attendanceCounts.checkedIn,
    voteRate: Number((voteRate * 100).toFixed(1)),
    checkRate: Number((attendanceRate * 100).toFixed(1)),
  };
}

export async function getGoalLeaders(
  clubId: string,
  referenceDate = MATCH_REF_DATE(),
): Promise<ClubInfoData["goalLeaders"]> {
  const { start, end } = getAnnualRange(referenceDate);
  const goals = await findAnnualGoals({ clubId, start, end });
  return mapGoalsToLeaders(goals);
}

export async function getRatingLeaders(
  clubId: string,
  referenceDate = MATCH_REF_DATE(),
): Promise<ClubInfoData["ratingLeaders"]> {
  const { start, end } = getAnnualRange(referenceDate);
  const evaluations = await findAnnualEvaluations({ clubId, start, end });
  return mapEvaluationsToLeaders(evaluations);
}

export async function getRecentNoticesSummary(
  clubId: string,
  take = 5,
): Promise<ClubInfoData["notices"]> {
  const notices = await findRecentNotices({ clubId, take });
  return notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    createdAt: notice.createdAt.toISOString(),
    boardSlug: notice.board?.slug ?? null,
    boardName: notice.board?.name ?? null,
  }));
}

export async function getClubInfoData(clubId: string): Promise<ClubInfoData> {
  const now = MATCH_REF_DATE();
  const [recentMatch, upcomingMatch, attendance, goalLeaders, ratingLeaders, notices] =
    await Promise.all([
      getRecentMatchHighlight(clubId, now),
      getUpcomingMatchHighlight(clubId, now),
      getAttendanceSummary(clubId, now),
      getGoalLeaders(clubId, now),
      getRatingLeaders(clubId, now),
      getRecentNoticesSummary(clubId),
    ]);

  return {
    recentMatch,
    upcomingMatch,
    attendance,
    goalLeaders,
    ratingLeaders,
    notices,
  };
}

export async function getClubLayoutData(clubId: string, userId?: string) {
  const [club, player] = await Promise.all([
    findClubById(clubId),
    userId ? findPlayerMembership(clubId, userId) : Promise.resolve(null),
  ]);
  return { club, player };
}
