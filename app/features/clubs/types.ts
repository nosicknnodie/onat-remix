/**
 * 클럽 기능의 타입 정의
 * - 클럽 도메인의 모든 타입을 중앙 집중식으로 관리
 * - Prisma 타입을 기반으로 한 확장된 클럽 타입 정의
 */

import type { Player, Prisma } from "@prisma/client";
import type { getClubLayoutData, getClubMembers } from "./service.server";

// 클럽 이미지와 엠블럼을 포함한 확장된 클럽 타입
export type Club = Prisma.ClubGetPayload<{
  include: {
    image: { select: { url: true } };
    emblem: { select: { url: true } };
  };
}>;

export type { Player };
// 클럽 카테고리별 분류 타입
export type CategorizedClubs = {
  my: Club[]; // 내가 속한 클럽들
  public: Club[]; // 공개 클럽들
};

// 클럽 목록 조회 결과 타입
export type ClubsData = {
  categorized: CategorizedClubs;
  players: Player[];
};

// 클럽 리스트 컴포넌트 Props 타입
export type ClubListProps = {
  clubs: Club[];
  players: Player[];
};

// 개별 클럽 카드 컴포넌트 Props 타입
export type ClubCardProps = {
  club: Club;
  isPending?: boolean;
};

export type IPlayer = Awaited<ReturnType<typeof getClubMembers>>[number];
export type IClubLayoutLoaderData = Awaited<ReturnType<typeof getClubLayoutData>>;
