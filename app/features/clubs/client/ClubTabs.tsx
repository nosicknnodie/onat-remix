/**
 * 공개 클럽 목록 섹션
 * - 이전 탭 UI를 대체하여 단일 공개 클럽 리스트만 표시
 */

import type React from "react";
import { Badge } from "~/components/ui/badge";
import type { Club, Player } from "../isomorphic/types";
import { ClubList } from "./ClubList";

interface ClubTabsProps {
  myClubs: Club[];
  publicClubs: Club[];
  players: Player[];
}

export const ClubTabs: React.FC<ClubTabsProps> = ({ myClubs, publicClubs, players }) => {
  const pendingClubIds = new Set(
    players.filter((player) => player.status === "PENDING").map((player) => player.clubId),
  );
  const pendingClubs = myClubs.filter((club) => pendingClubIds.has(club.id));
  const filteredPublicClubs = publicClubs.filter((club) => !pendingClubIds.has(club.id));

  return (
    <div className="flex flex-col gap-8">
      {pendingClubs.length > 0 && (
        <section className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit border-amber-500 text-amber-500">
            가입 대기 중
          </Badge>
          <ClubList clubs={pendingClubs} players={players} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <Badge variant="outline" className="w-fit border-primary text-primary">
          공개 클럽
        </Badge>
        <ClubList clubs={filteredPublicClubs} players={players} />
      </section>
    </div>
  );
};
