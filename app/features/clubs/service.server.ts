/**
 * 클럽 관련 비즈니스 로직 서비스
 * - 복잡한 데이터 처리와 비즈니스 규칙을 캡슐화
 * - 쿼리 결과를 UI에 적합한 형태로 변환
 */

import { prisma } from "~/libs/db/db.server";
import {
  findClubsAndPlayers,
  getAllClubPlayers as getAllClubPlayersQuery,
  getClubMembers as getClubMembersQuery,
  getClubMercenaries as getClubMercenariesQuery,
  getClubOwner as getClubOwnerQuery,
  getClubWithPlayer,
  getPendingClubMembers as getPendingClubMembersQuery,
} from "./queries.server";
import type { CategorizedClubs, Club, ClubsData, Player } from "./types";

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
