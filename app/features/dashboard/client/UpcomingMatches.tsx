import dayjs from "dayjs";
import { FaCalendarCheck } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import type { DashboardMatchInsight } from "../isomorphic";

type Props = {
  items?: DashboardMatchInsight[] | null;
  isLoading?: boolean;
  isPending?: boolean;
  onVote: (item: DashboardMatchInsight, isVote: boolean) => Promise<void> | void;
  onCheck: (item: DashboardMatchInsight) => Promise<void> | void;
};

export const UpcomingMatches = ({ items, isLoading, isPending, onVote, onCheck }: Props) => {
  const now = dayjs();

  const canVote = (stDate: string) => {
    const start = dayjs(stDate);
    const voteDeadline = start.startOf("day");
    return now.isBefore(voteDeadline);
  };

  const canCheck = (stDate: string) => {
    const start = dayjs(stDate);
    const checkStart = start.subtract(2, "hour");
    const checkEnd = start.add(2, "hour");
    return now.isAfter(checkStart) && now.isBefore(checkEnd);
  };

  return (
    <div className="w-full h-full border border-gray-200 bg-white p-2 rounded-lg min-h-36 flex flex-col gap-3">
      <div className="font-semibold px-2 text-sm flex items-center gap-1">
        <FaCalendarCheck className="text-primary" />
        <span>다가오는 일정 / 출석</span>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-sm text-muted-foreground px-2 py-4">표시할 일정이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => {
            const voteEnabled = canVote(item.stDate);
            const checkEnabled = canCheck(item.stDate);
            const userVote = item.userAttendance?.isVote ?? null;
            const userCheck = item.userAttendance?.isCheck ?? false;
            const start = dayjs(item.stDate);
            const phase = voteEnabled
              ? "VOTE"
              : now.isBefore(start.subtract(2, "hour"))
                ? "VOTE_LOCKED"
                : now.isBefore(start.add(2, "hour"))
                  ? "CHECK"
                  : "ENDED";
            return (
              <div
                key={`${item.matchId}-${item.matchClubId}`}
                className="rounded-xl bg-gray-50 p-4 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage
                        src={item.clubEmblemUrl ?? "/images/club-default-emblem.webp"}
                        alt={item.clubName}
                      />
                      <AvatarFallback className="bg-primary-foreground"></AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold">{item.clubName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    참여 {item.summary.attendance.voted}/{item.summary.attendance.total}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-bold">{item.matchTitle}</span>
                  <span className="text-sm text-muted-foreground">
                    장소: {item.placeName ?? "장소 미정"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    일정: {dayjs(item.stDate).format("M월 D일 ddd HH:mm")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {phase === "VOTE"
                      ? "경기 전날까지 참석/불참 입력"
                      : phase === "VOTE_LOCKED"
                        ? "경기 하루 전~2시간 전: 참석/불참 수정 불가"
                        : phase === "CHECK"
                          ? "경기 2시간 전부터 경기 후 2시간까지 출석 가능"
                          : "출석 마감"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(phase === "VOTE" || phase === "VOTE_LOCKED") && (
                    <>
                      <Button
                        size="sm"
                        variant={userVote === true ? "default" : "outline"}
                        disabled={phase !== "VOTE" || isPending || userVote === true}
                        onClick={() => onVote(item, true)}
                        className="flex-1"
                      >
                        🙋‍♂️ 참석
                      </Button>
                      <Button
                        size="sm"
                        variant={userVote === false ? "default" : "outline"}
                        disabled={phase !== "VOTE" || isPending || userVote === false}
                        onClick={() => onVote(item, false)}
                        className="flex-1"
                      >
                        🙅‍♂️ 불참
                      </Button>
                    </>
                  )}
                  {phase === "CHECK" && (
                    <Button
                      size="sm"
                      variant={userCheck ? "default" : "outline"}
                      disabled={!checkEnabled || isPending}
                      onClick={() => onCheck(item)}
                      className="flex-1"
                    >
                      {userCheck ? "✅ 출석 완료" : "🛎️ 출석"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
