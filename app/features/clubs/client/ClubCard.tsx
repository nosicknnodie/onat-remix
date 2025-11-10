/**
 * 개별 클럽 카드 컴포넌트
 * - 클럽의 기본 정보를 카드 형태로 표시
 * - 가입 대기 상태 배지 표시
 * - 클럽 상세페이지로의 네비게이션 링크
 */

import { Link, useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { useSession } from "~/contexts";
import { useToast } from "~/hooks";
import { getToastForError, postJson } from "~/libs";
import type { ClubCardProps } from "../isomorphic/types";
import { JoinDialog } from "./JoinDialog";

const REJOINABLE_STATUSES = new Set(["LEFT", "BANNED", "REJECTED", "CANCELLED"]);

interface ClubCardPropsWithNavigation extends ClubCardProps {
  // Link 컴포넌트를 props로 받아서 Remix 의존성 제거
}

export const ClubCard: React.FC<ClubCardPropsWithNavigation> = ({ club, membership = null }) => {
  const user = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updatedAt = membership?.updatedAt ? new Date(membership.updatedAt) : null;
  const hoursSinceUpdate =
    updatedAt != null ? (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60) : null;

  const isPending = membership?.status === "PENDING";
  const isRejected = membership?.status === "REJECTED";
  const isCancelled = membership?.status === "CANCELLED";
  const canJoin = !!user && !membership;
  const canRejoin =
    !!user &&
    !!membership &&
    updatedAt != null &&
    REJOINABLE_STATUSES.has(membership.status) &&
    (membership.status === "CANCELLED" || (hoursSinceUpdate ?? 0) > 1);
  const showStatusArea = canJoin || canRejoin || isPending || isRejected || isCancelled;

  const { mutateAsync: cancelJoinRequest, isPending: isCancelling } = useMutation({
    mutationFn: async () => await postJson(`/api/clubs/${club.id}/join/cancel`),
    onError: (error) => toast(getToastForError(error)),
  });

  const handleCancel = async () => {
    try {
      await cancelJoinRequest();
      toast({ title: "가입 신청을 취소했습니다." });
      navigate(0);
    } catch (_e) {
      // handled via onError
    }
  };

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

      {showStatusArea && (
        <div className="border-t p-3 flex flex-col gap-2">
          {canJoin && (
            <JoinDialog clubId={club.id}>
              <Button size="sm" className="w-full">
                가입
              </Button>
            </JoinDialog>
          )}

          {canRejoin && (
            <JoinDialog clubId={club.id} player={membership ?? undefined}>
              <Button size="sm" variant="outline" className="w-full">
                재가입
              </Button>
            </JoinDialog>
          )}

          {isPending && <FormSuccess>가입 승인 대기중입니다.</FormSuccess>}
          {isPending && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? "취소 중..." : "신청 취소"}
            </Button>
          )}
          {isRejected && <FormError className="py-2">가입 승인 거절되었습니다.</FormError>}
          {isCancelled && (
            <FormSuccess>가입 신청이 취소되었습니다. 다시 신청하려면 재가입을 눌러주세요.</FormSuccess>
          )}
        </div>
      )}
    </div>
  );
};
