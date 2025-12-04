import { Link } from "@remix-run/react";
import type React from "react";
import { FiHeart, FiHelpCircle } from "react-icons/fi";
import { HiUser } from "react-icons/hi";
import { MdEmojiEvents } from "react-icons/md";
import { Loading } from "~/components/Loading";
import StarRating from "~/components/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { AttendanceCheckStatus, AttendanceStatus } from "~/features/matches/isomorphic";
import { cn } from "~/libs/isomorphic";
import {
  type AttendanceSummaryItem,
  type PendingSummaryItem,
  PreMatchAttendanceSummary,
} from "./PreMatchAttendanceSummary";

export type PreMatchSummaryData = {
  attend: AttendanceSummaryItem[];
  absent: AttendanceSummaryItem[];
  pending: PendingSummaryItem[];
};

const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  ATTEND: "참석",
  ABSENT: "불참",
  PENDING: "선택안함",
};

type PreMatchSectionProps = {
  summary: PreMatchSummaryData;
  attendancePageHref?: string;
  canVoteAttendance: boolean;
  attendanceIsLoading: boolean;
  hasAttendanceData: boolean;
  currentStatus: AttendanceStatus | null;
  attendanceMutationPending: boolean;
  onAttendanceVote: (isVote: boolean) => void | Promise<void>;
};

export function PreMatchSection({
  summary,
  attendancePageHref,
  canVoteAttendance,
  attendanceIsLoading,
  hasAttendanceData,
  currentStatus,
  attendanceMutationPending,
  onAttendanceVote,
}: PreMatchSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className=" space-x-2">
                  <span className="font-semibold text-base">참석 / 불참</span>
                  <span className="inline-flex items-center gap-1 cursor-help">
                    <FiHelpCircle />
                  </span>
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-muted text-muted-foreground">
                경기 하루 전까지 참석 여부를 선택할 수 있고, 시작 2시간 전까지 목록이 고정됩니다.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {attendancePageHref ? (
          <Button variant="ghost" size="sm" asChild>
            <Link to={attendancePageHref}>참석/출석 페이지</Link>
          </Button>
        ) : null}
      </div>
      <PreMatchAttendanceSummary
        attend={summary.attend}
        absent={summary.absent}
        pending={summary.pending}
      />
      {canVoteAttendance && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <p className="text-sm font-medium">내 참석 선택</p>
          {attendanceIsLoading ? (
            <Loading size={16} />
          ) : hasAttendanceData ? (
            <>
              <span className="text-sm text-muted-foreground">
                현재 상태: {currentStatus ? attendanceStatusLabel[currentStatus] : "확인 중"}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={currentStatus === "ATTEND" ? "default" : "outline"}
                  size="sm"
                  disabled={attendanceMutationPending}
                  onClick={() => onAttendanceVote(true)}
                >
                  참석
                </Button>
                <Button
                  variant={currentStatus === "ABSENT" ? "default" : "outline"}
                  size="sm"
                  disabled={attendanceMutationPending}
                  onClick={() => onAttendanceVote(false)}
                >
                  불참
                </Button>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              참석 기능은 클럽 구성원이나 용병에게만 제공됩니다.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

type CheckInSectionProps = {
  attendanceIsLoading: boolean;
  hasAttendanceData: boolean;
  currentStatus: AttendanceStatus | null;
  currentChecked: AttendanceCheckStatus | null;
  attendanceMutationPending: boolean;
  onCheckIn: () => void | Promise<void>;
  attendanceList: Array<{ id: string; name: string; isChecked: boolean }>;
};

export function CheckInSection({
  attendanceIsLoading,
  hasAttendanceData,
  currentStatus,
  currentChecked,
  attendanceMutationPending,
  onCheckIn,
  attendanceList,
}: CheckInSectionProps) {
  return (
    <div className="rounded-lg space-y-3">
      <p className="text-base font-semibold">출석 체크</p>
      {attendanceIsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loading size={16} />
          출석 정보를 불러오는 중입니다.
        </div>
      ) : hasAttendanceData ? (
        <div className="space-y-3">
          <div className="rounded-md">
            {attendanceList.length > 0 ? (
              <div className="grid gap-2 max-sm:grid-cols-2 sm:max-lg:grid-cols-3 lg:grid-cols-5">
                {attendanceList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{item.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        item.isChecked
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.isChecked ? "출석완료" : "미출석"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">표시할 출석 정보가 없습니다.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              disabled={
                attendanceMutationPending ||
                currentStatus !== "ATTEND" ||
                currentChecked === "CHECKED"
              }
              onClick={onCheckIn}
            >
              {currentChecked === "CHECKED" ? "출석완료" : "내 출석 체크"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          출석 정보를 확인할 수 없습니다. 참석 선택 후 다시 시도해주세요.
        </div>
      )}
    </div>
  );
}

type HighlightItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  scoreAverage?: number | null;
  likeCount?: number | null;
  goalCount?: number | null;
};

export function PostMatchSection({
  moms,
  likes,
  goals,
}: {
  moms: HighlightItem[];
  likes: HighlightItem[];
  goals: HighlightItem[];
}) {
  const renderList = (
    title: string,
    items: HighlightItem[],
    renderMeta: (item: HighlightItem) => React.ReactNode,
    emptyText: string,
    icon?: React.ReactNode,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-base font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.imageUrl ?? undefined} alt={item.name} />
                <AvatarFallback>
                  <HiUser />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                {renderMeta(item)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderList(
        "Man of the Match",
        moms,
        (item) =>
          typeof item.scoreAverage === "number" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StarRating
                id={`${item.id}-mom`}
                score={item.scoreAverage}
                width={16}
                isHighLight
                disabled
                onClick={() => {}}
              />
              <span className="font-medium text-foreground">
                {(item.scoreAverage / 20).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">평점 정보 없음</span>
          ),
        "집계된 MOM 정보가 없습니다.",
        <MdEmojiEvents className="text-yellow-400" />,
      )}
      {renderList(
        "좋아요",
        likes,
        (item) => (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FiHeart className="text-pink-500" />
            <span className="font-medium text-foreground">
              {typeof item.likeCount === "number" ? `${item.likeCount}개` : "집계 없음"}
            </span>
          </div>
        ),
        "좋아요 정보가 없습니다.",
        <FiHeart className="text-pink-500" />,
      )}
      {renderList(
        "골 득점",
        goals,
        (item) => (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{item.goalCount ?? 0}골</span>
          </div>
        ),
        "득점 정보가 없습니다.",
        <MdEmojiEvents />,
      )}
    </div>
  );
}
