/**
 * 클럽 관련 비즈니스 로직 서비스
 * - 복잡한 데이터 처리와 비즈니스 규칙을 캡슐화
 * - 쿼리 결과를 UI에 적합한 형태로 변환
 */

import { findClubsAndPlayers } from "./queries.server";
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
