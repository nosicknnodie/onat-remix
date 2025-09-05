/**
 * 클럽 관련 데이터베이스 쿼리 함수들
 * - 데이터 접근 로직을 중앙화하여 재사용성 확보
 * - 복잡한 Prisma 쿼리를 추상화하여 비즈니스 로직에서 쉽게 사용
 */

import { prisma } from "~/libs/db/db.server";
import type { Club, Player } from "./types";

/**
 * 사용자가 접근할 수 있는 모든 클럽을 조회
 * - 공개 클럽 또는 사용자가 속한 클럽(승인/대기 상태)
 */
export async function findAccessibleClubs(userId?: string): Promise<Club[]> {
  return await prisma.club.findMany({
    where: {
      OR: [
        { isPublic: true },
        {
          players: {
            some: {
              userId: userId || "",
              status: { in: ["APPROVED", "PENDING"] },
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      image: { select: { url: true } },
      emblem: { select: { url: true } },
    },
  });
}

/**
 * 특정 사용자의 플레이어 정보를 조회
 * - 사용자가 속한 모든 클럽의 멤버십 정보
 */
export async function findPlayersByUserId(userId?: string): Promise<Player[]> {
  if (!userId) return [];
  return await prisma.player.findMany({
    where: {
      userId,
    },
  });
}

/**
 * 클럽 목록과 사용자 플레이어 정보를 병렬로 조회
 * - 성능 최적화를 위한 Promise.all 사용
 */
export async function findClubsAndPlayers(userId?: string) {
  return Promise.all([findAccessibleClubs(userId), findPlayersByUserId(userId)]);
}

/**
 * ID를 기준으로 특정 클럽 정보와 사용자의 플레이어 정보를 함께 조회
 * - 클럽 레이아웃과 같은 곳에서 클럽 상세 정보와 사용자 권한을 동시에 확인하기 위해 사용
 */
export async function getClubWithPlayer(clubId: string, userId?: string) {
  const [club, player] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      include: {
        image: { select: { url: true } },
        emblem: { select: { url: true } },
      },
    }),
    userId
      ? prisma.player.findFirst({
          where: {
            userId,
            clubId,
          },
          include: {
            user: {
              include: {
                userImage: true,
              },
            },
          },
        })
      : null,
  ]);

  return { club, player };
}

/**
 * 클럽 소유자 ID를 조회
 * - 수정/삭제 등 소유권이 필요한 작업 전에 권한을 확인하기 위해 사용
 */
export async function getClubOwner(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerUserId: true },
  });
  return club?.ownerUserId;
}

/**
 * 특정 클럽의 승인된 멤버 목록을 조회
 */
export async function getClubMembers(clubId: string) {
  return await prisma.player.findMany({
    where: {
      clubId: clubId,
      status: "APPROVED",
    },
    include: {
      user: {
        include: {
          userImage: true,
        },
      },
    },
  });
}

/**
 * 특정 클럽의 가입 대기중인 멤버 목록을 조회
 */
export async function getPendingClubMembers(clubId: string) {
  return await prisma.player.findMany({
    where: {
      clubId: clubId,
      status: "PENDING",
    },
    include: {
      user: {
        include: {
          userImage: true,
        },
      },
    },
  });
}

/**
 * 특정 클럽의 용병 목록을 조회
 */
export async function getClubMercenaries(clubId: string) {
  return await prisma.mercenary.findMany({
    where: {
      clubId: clubId,
    },
    include: {
      attendances: true,
      user: {
        include: {
          userImage: true,
        },
      },
    },
  });
}

/**
 * 특정 클럽의 모든 선수 목록을 조회 (상태 무관)
 */
export async function getAllClubPlayers(clubId: string) {
  return await prisma.player.findMany({
    where: {
      clubId: clubId,
    },
    include: {
      user: {
        include: {
          userImage: true,
        },
      },
    },
  });
}
