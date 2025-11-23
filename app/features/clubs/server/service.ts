/**
 * 클럽 관련 비즈니스 로직 서비스
 * - 복잡한 데이터 처리와 비즈니스 규칙을 캡슐화
 * - 쿼리 결과를 UI에 적합한 형태로 변환
 */

import type { Prisma } from "@prisma/client";
import { AES, prisma } from "~/libs/index.server";
import type { CategorizedClubs, Club, ClubsData, ClubWithMembership, Player } from "../isomorphic";
import {
  findClubsAndPlayers,
  findMemberClubsWithMemberships,
  getAllClubPlayers as getAllClubPlayersQuery,
  getClubMembers as getClubMembersQuery,
  getClubMercenaries as getClubMercenariesQuery,
  getClubOwner as getClubOwnerQuery,
  getPendingClubMembers as getPendingClubMembersQuery,
} from "./queries";
import { sanitizeDiscordWebhook } from "./utils";

export {
  getAttendanceSummary,
  getClubInfoData,
  getClubLayoutData,
  getGoalLeaders,
  getRatingLeaders,
  getRecentMatchHighlight,
  getRecentNoticesSummary,
  getUpcomingMatchHighlight,
} from "./info.service";

/**
 * 클럽들을 카테고리별로 분류
 * - 내 클럽: 사용자가 멤버인 클럽들
 * - 공개 클럽: 내 클럽이 아닌 공개 클럽들
 */
export function categorizeClubs(clubs: Club[], players: Player[]): CategorizedClubs {
  // 승인/대기 상태만 내 클럽으로 분류
  const activeMembershipStatuses: Array<Player["status"]> = ["APPROVED", "PENDING"];
  const myClubIds = new Set(
    players.filter((p) => activeMembershipStatuses.includes(p.status)).map((p) => p.clubId),
  );

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
  const discordWebhook = formData.get("discordWebhook")?.toString().trim();

  const sanitizedWebhook = sanitizeDiscordWebhook(discordWebhook);
  if (discordWebhook && !sanitizedWebhook) {
    return { ok: false, message: "유효한 Discord Webhook URL을 입력해주세요." };
  }

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
        discordWebhook: sanitizedWebhook,
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
      const logData = {
        playerId: player.id,
        type: "STATUS",
        value: "START",
        from: existingPlayer?.status.toString() ?? null,
        to: "PENDING",
        createUserId: userId,
        createPlayerId: player.id,
      } as unknown as Prisma.PlayerLogUncheckedCreateInput;
      await prisma.playerLog.create({ data: logData });
    }
    return { ok: true, message: "가입신청 완료 했습니다." };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "가입 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 가입 신청 취소
 */
export async function cancelJoinRequest(clubId: string, userId: string) {
  try {
    const player = await prisma.player.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!player || player.status !== "PENDING") {
      return { ok: false, message: "취소할 가입 신청이 없습니다." };
    }

    await prisma.$transaction([
      prisma.player.update({
        where: { id: player.id },
        data: {
          status: "CANCELLED",
          role: "PENDING",
        },
      }),
      prisma.playerLog.create({
        data: {
          playerId: player.id,
          type: "STATUS",
          value: "END",
          from: player.status,
          to: "CANCELLED",
          createUserId: userId,
          createPlayerId: player.id,
        } as unknown as Prisma.PlayerLogUncheckedCreateInput,
      }),
    ]);

    return { ok: true, message: "가입 신청을 취소했습니다." };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "가입 신청 취소 중 오류가 발생했습니다." };
  }
}

/**
 * 클럽 용병 목록을 조회
 */
export async function getClubMercenaries(clubId: string) {
  const [mercenaries, members] = await Promise.all([
    getClubMercenariesQuery(clubId),
    getClubMembersQuery(clubId),
  ]);
  const memberUserIds = new Set(
    members.map((member) => member.userId).filter((userId): userId is string => Boolean(userId)),
  );

  return mercenaries
    .filter((mercenary) => {
      if (!mercenary.userId) return true;
      return !memberUserIds.has(mercenary.userId);
    })
    .map((mercenary) => ({
      ...mercenary,
      hp: mercenary.hp ? AES.decrypt(mercenary.hp) : null,
    }));
}

/**
 * 클럽의 모든 선수 목록을 조회 (상태 무관)
 */
export async function getAllClubPlayers(clubId: string) {
  return await getAllClubPlayersQuery(clubId);
}

type ClubMatchesFeedParams = {
  clubId: string;
  take: number;
  cursor?: string | null;
};

export async function getClubMatchesFeed({ clubId, take, cursor }: ClubMatchesFeedParams) {
  const matches = await prisma.matchClub.findMany({
    where: { clubId, isUse: true },
    include: {
      match: {
        include: {
          createUser: {
            include: {
              userImage: true,
            },
          },
        },
      },
      teams: true,
      quarters: {
        include: {
          team1: true,
          team2: true,
        },
      },
    },
    orderBy: [{ match: { stDate: "desc" } }, { createdAt: "desc" }],
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = matches.length > take;
  const sliced = hasMore ? matches.slice(0, take) : matches;
  const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null;

  return {
    matches: sliced,
    pageInfo: {
      hasMore,
      nextCursor,
      take,
    },
  };
}
