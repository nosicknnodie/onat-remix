/**
 * 공개 클럽 목록 섹션
 * - 이전 탭 UI를 대체하여 단일 공개 클럽 리스트만 표시
 */

import type React from "react";
import { Badge } from "~/components/ui/badge";
import type { Club, Player } from "../isomorphic/types";
import { ClubList } from "./ClubList";

interface ClubTabsProps {
  publicClubs: Club[];
  players: Player[];
}

export const ClubTabs: React.FC<ClubTabsProps> = ({ publicClubs, players }) => {
  return (
    <section className="flex flex-col gap-4">
      <Badge variant="outline" className="w-fit border-primary text-primary">
        공개 클럽
      </Badge>
      <ClubList clubs={publicClubs} players={players} />
    </section>
  );
};
