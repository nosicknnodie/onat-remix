/**
 * 개별 클럽 카드 컴포넌트
 * - 클럽의 기본 정보를 카드 형태로 표시
 * - 가입 대기 상태 배지 표시
 * - 클럽 상세페이지로의 네비게이션 링크
 */

import { Link } from "@remix-run/react";
import type React from "react";
import { Badge } from "~/components/ui/badge";
import type { ClubCardProps } from "../types";

interface ClubCardPropsWithNavigation extends ClubCardProps {
  // Link 컴포넌트를 props로 받아서 Remix 의존성 제거
}

export const ClubCard: React.FC<ClubCardPropsWithNavigation> = ({ club, isPending = false }) => {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden relative">
      {/* 가입 대기 상태 배지 */}
      {isPending && (
        <Badge className="absolute top-2 right-2 text-xs z-10" variant="destructive">
          가입대기
        </Badge>
      )}

      {/* 클럽 대표 이미지 */}
      <Link to={`/clubs/${club.id}`}>
        <img
          src={club.image?.url || "/images/club-default-image.webp"}
          alt="클럽 대표 이미지"
          className="w-full h-32 object-cover mb-2"
        />
      </Link>

      {/* 클럽 위치 및 공개 여부 */}
      <div className="flex justify-end px-2">
        <p className="text-xs text-gray-500">
          {club.si || "-"} {club.gun || "-"} / {club.isPublic ? "공개" : "비공개"}
        </p>
      </div>

      {/* 클럽 기본 정보 */}
      <div className="flex p-2 gap-2 items-center overflow-hidden w-full">
        {/* 클럽 엠블럼 */}
        <Link to={`/clubs/${club.id}`} className="flex-shrink-0">
          <img
            src={club.emblem?.url || "/images/club-default-emblem.webp"}
            alt="클럽 엠블럼"
            className="w-10 h-10 object-cover rounded-lg"
          />
        </Link>

        {/* 클럽명 및 설명 */}
        <div className="flex-shrink min-w-0 w-full">
          <Link to={`/clubs/${club.id}`} className="block">
            <h3 className="text-xl font-semibold text-foreground hover:text-primary">
              {club.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground truncate w-full">
            {club.description || "설명이 없습니다"}
          </p>
        </div>
      </div>
    </div>
  );
};
