/**
 * 클럽 관련 비즈니스 로직 서비스
 * - 복잡한 데이터 처리와 비즈니스 규칙을 캡슐화
 * - 쿼리 결과를 UI에 적합한 형태로 변환
 */

import dayjs from "dayjs";
import type { MatchWithSummary } from "~/features/matches/isomorphic";
import { summaryService } from "~/features/matches/server";
import { prisma } from "~/libs/index.server";
import type {
  CategorizedClubs,
  Club,
  ClubInfoData,
  ClubLeaderboardItem,
  ClubMatchHighlight,
  ClubsData,
  ClubWithMembership,
  Player,
} from "../isomorphic";
import {
  countAnnualAttendance,
  findAnnualEvaluations,
  findAnnualGoals,
  findClubsAndPlayers,
  findMemberClubsWithMemberships,
  findRecentMatchForClub,
  findRecentNotices,
  findUpcomingMatchForClub,
  getAllClubPlayers as getAllClubPlayersQuery,
  getClubMembers as getClubMembersQuery,
  getClubMercenaries as getClubMercenariesQuery,
  getClubOwner as getClubOwnerQuery,
  getClubWithPlayer,
  getPendingClubMembers as getPendingClubMembersQuery,
} from "./queries";

/**
 * 클럽들을 카테고리별로 분류
 * - 내 클럽: 사용자가 멤버인 클럽들
 * - 공개 클럽: 내 클럽이 아닌 공개 클럽들
 */
export function categorizeClubs(clubs: Club[], players: Player[]): CategorizedClubs {
  // 사용자가 속한 클럽 ID 목록 추출
  const myClubIds = new Set(players.map((p) => p.clubId));

  // 클럽을 내 클럽과 공개 클럽으로 분류
  const myClubs = clubs.filter((club) => myClubIds.has(club.id));
  const publicClubs = clubs.filter((club) => !myClubIds.has(club.id));

  return {
    my: myClubs,
    public: publicClubs,
  };
}

/**
 * 사용자의 클럽 데이터를 조회하고 카테고리별로 분류
 * - 데이터 조회부터 분류까지의 전체 플로우 관리
 */
export async function getClubsData(userId?: string): Promise<ClubsData> {
  const [clubs, players] = await findClubsAndPlayers(userId);
  const categorized = categorizeClubs(clubs, players);

  return {
    categorized,
    players,
  };
}

/**
 * 사용자의 클럽 데이터를 조회
 */
export async function getMyClubsData(userId?: string): Promise<ClubWithMembership[]> {
  if (!userId) {
    return [];
  }
  const memberships = await findMemberClubsWithMemberships(userId);
  return memberships.map(({ club, ...player }) => ({
    ...club,
    membership: player,
  }));
}

/**
 * 특정 클럽에서 사용자의 상태를 확인
 * - 가입 대기, 승인, 거부 등의 상태 확인
 */
export function getPlayerStatus(clubId: string, players: Player[]): Player["status"] | null {
  const player = players.find((p) => p.clubId === clubId);
  return player?.status || null;
}

/**
 * 클럽 레이아웃에 필요한 데이터를 조회
 * - 클럽 정보와 현재 사용자의 멤버십 정보를 함께 반환
 */
export async function getClubLayoutData(clubId: string, userId?: string) {
  return await getClubWithPlayer(clubId, userId);
}

type AttendanceWithMember = Awaited<
  ReturnType<typeof findAnnualGoals>
>[number]["assigned"]["attendance"];

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
    const member = extractMember(goal.assigned?.attendance);
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

export async function getClubInfoData(clubId: string): Promise<ClubInfoData> {
  const now = dayjs();
  const startOfYear = now.startOf("year").toDate();
  const endOfYear = now.endOf("year").toDate();

  const [recentMatch, upcomingMatch, attendanceCounts, goals, evaluations, notices] =
    await Promise.all([
      findRecentMatchForClub(clubId, now.toDate()),
      findUpcomingMatchForClub(clubId, now.toDate()),
      countAnnualAttendance({ clubId, start: startOfYear, end: endOfYear }),
      findAnnualGoals({ clubId, start: startOfYear, end: endOfYear }),
      findAnnualEvaluations({ clubId, start: startOfYear, end: endOfYear }),
      findRecentNotices({ clubId, take: 5 }),
    ]);

  const attendanceRate =
    attendanceCounts.total === 0 ? 0 : attendanceCounts.checkedIn / attendanceCounts.total;
  const voteRate =
    attendanceCounts.total === 0 ? 0 : attendanceCounts.voted / attendanceCounts.total;

  return {
    recentMatch: toMatchHighlight(recentMatch, clubId),
    upcomingMatch: toMatchHighlight(upcomingMatch, clubId),
    attendance: {
      total: attendanceCounts.total,
      voted: attendanceCounts.voted,
      checkedIn: attendanceCounts.checkedIn,
      voteRate: Number((voteRate * 100).toFixed(1)),
      checkRate: Number((attendanceRate * 100).toFixed(1)),
    },
    goalLeaders: mapGoalsToLeaders(goals),
    ratingLeaders: mapEvaluationsToLeaders(evaluations),
    notices: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      createdAt: notice.createdAt.toISOString(),
      boardSlug: notice.board?.slug ?? null,
      boardName: notice.board?.name ?? null,
    })),
  } satisfies ClubInfoData;
}

/**
 * 클럽 소유자 정보를 조회
 * - 소유권 확인 로직에 사용
 */
export async function getClubOwner(clubId: string) {
  return await getClubOwnerQuery(clubId);
}

/**
 * 클럽 정보를 수정
 * - 소유권 확인 후, 받은 정보로 클럽 데이터를 업데이트
 */
export async function updateClub(formData: FormData, userId: string) {
  const id = formData.get("id")?.toString();

  if (!id) {
    return { ok: false, message: "클럽 ID가 없습니다." };
  }

  // 소유권 확인
  const ownerId = await getClubOwnerQuery(id);
  if (ownerId !== userId) {
    return { ok: false, message: "클럽을 수정할 권한이 없습니다." };
  }

  const name = formData.get("name")?.toString().trim();
  if (!name) {
    return { ok: false, message: "클럽 이름은 필수입니다." };
  }

  const imageId = formData.get("imageId")?.toString() || null;
  const emblemId = formData.get("emblemId")?.toString() || null;
  const description = formData.get("description")?.toString().trim();
  const isPublic = formData.get("isPublic") === "true";
  const si = formData.get("si")?.toString();
  const gun = formData.get("gun")?.toString();

  try {
    const club = await prisma.club.update({
      where: { id },
      data: {
        name,
        description,
        isPublic,
        imageId: imageId || undefined,
        emblemId: emblemId || undefined,
        si: si !== "null" ? si || null : null,
        gun: gun !== "null" ? gun || null : null,
      },
    });
    return { ok: true, club };
  } catch (err) {
    console.error(err);
    return { ok: false, message: "클럽 정보 수정 중 오류가 발생했습니다." };
  }
}

/**
 * 클럽 멤버 목록을 조회
 */
export async function getClubMembers(clubId: string) {
  return await getClubMembersQuery(clubId);
}

/**
 * 클럽 가입 대기자 목록을 조회
 */
export async function getPendingClubMembers(clubId: string) {
  return await getPendingClubMembersQuery(clubId);
}

/**
 * 클럽에 가입 신청
 */
export async function joinClub(clubId: string, userId: string, nick: string) {
  if (!nick) {
    return { ok: false, message: "닉네임이 없습니다." };
  }

  try {
    const existingPlayer = await prisma.player.findUnique({
      where: {
        clubId_userId: {
          userId,
          clubId,
        },
      },
    });

    if (
      !existingPlayer ||
      (existingPlayer.status !== "APPROVED" && existingPlayer.status !== "PENDING")
    ) {
      const player = await prisma.player.upsert({
        where: {
          clubId_userId: {
            userId,
            clubId,
          },
        },
        update: {
          nick,
          role: "PENDING",
          status: "PENDING",
          jobTitle: "NO",
        },
        create: {
          nick,
          userId,
          clubId,
        },
      });
      await prisma.playerLog.create({
        data: {
          playerId: player.id,
          type: "STATUS",
          value: "START",
          from: existingPlayer?.status.toString() ?? null,
          to: "PENDING",
          createUserId: userId,
        },
      });
    }
    return { ok: true, message: "가입신청 완료 했습니다." };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "가입 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 클럽 용병 목록을 조회
 */
export async function getClubMercenaries(clubId: string) {
  return await getClubMercenariesQuery(clubId);
}

/**
 * 클럽의 모든 선수 목록을 조회 (상태 무관)
 */
export async function getAllClubPlayers(clubId: string) {
  return await getAllClubPlayersQuery(clubId);
}
