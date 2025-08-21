/**
 * 클럽 목록 표시 컴포넌트
 * - 클럽 카드들을 그리드 레이아웃으로 표시
 * - 빈 상태(empty state) 처리
 * - 반응형 디자인 적용 (모바일/태블릿/데스크탑)
 */

import type React from "react";
import type { ClubListProps } from "../types";
import { ClubCard } from "./ClubCard";

export const ClubList: React.FC<ClubListProps> = ({ clubs, players }) => {
  // 빈 상태 처리
  if (clubs.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-muted-foreground">
          <p className="text-lg mb-2">클럽이 없습니다</p>
          <p className="text-sm">새로운 클럽을 만들어보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid max-sm:grid-cols-1 sm:max-xl:grid-cols-3 xl:grid-cols-4 gap-4">
      {clubs.map((club) => {
        // 현재 사용자의 해당 클럽에서의 상태 확인
        const myPlayer = players.find((p) => p.clubId === club.id);
        const isPending = myPlayer?.status === "PENDING";

        return <ClubCard key={club.id} club={club} isPending={isPending} />;
      })}
    </div>
  );
};
