import { HiUser } from "react-icons/hi";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { MatchClubSummary } from "~/features/matches/types";

interface MatchSummarySectionProps {
  summaries: MatchClubSummary[];
}

const formatPercentage = (value: number, total: number) => {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

export const MatchSummarySection = ({ summaries }: MatchSummarySectionProps) => {
  const moms = summaries.filter((summary) => summary.mom);
  return (
    <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>경기 요약</CardTitle>
          <CardDescription>득점과 출석 현황을 한눈에 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">표시할 매치 요약이 없습니다.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {summaries.map((summary) => {
                const attendanceRate = formatPercentage(
                  summary.attendance.voted,
                  summary.attendance.total,
                );
                const ownSegments = [
                  summary.goals.ownCommitted > 0 ? `자책 ${summary.goals.ownCommitted}` : null,
                  summary.goals.ownReceived > 0 ? `상대 자책 ${summary.goals.ownReceived}` : null,
                ].filter(Boolean);
                const attendanceSummary = `출석 ${summary.attendance.voted}/${summary.attendance.total} (${attendanceRate})`;
                const ownSummary = ownSegments.join(" · ");
                return (
                  <div
                    key={summary.matchClubId}
                    className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={summary.club.emblemUrl ?? undefined}
                          alt={summary.club.name}
                        />
                        <AvatarFallback>{summary.club.name.at(0) ?? <HiUser />}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold">{summary.club.name}</p>
                        <p className="text-xs text-muted-foreground">{attendanceSummary}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">득점</p>
                        <p className="text-2xl font-bold text-primary">{summary.goals.scored}</p>
                        {summary.goals.ownCommitted > 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            자책 {summary.goals.ownCommitted}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-right">
                        <p className="text-xs text-muted-foreground">실점</p>
                        <p className="text-2xl font-semibold">{summary.goals.conceded}</p>
                        {ownSegments.length > 0 ? (
                          <p className="text-[11px] text-muted-foreground">{ownSummary}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>MOM</CardTitle>
          <CardDescription>이번 경기에서 가장 빛난 선수를 소개합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {moms.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 집계된 MOM 정보가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {moms.map((summary) => {
                const mom = summary.mom!;
                return (
                  <div
                    key={mom.attendanceId}
                    className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mom.imageUrl ?? undefined} alt={mom.name} />
                        <AvatarFallback>{mom.name.at(0) ?? <HiUser />}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold">{mom.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="rounded-full">
                            {mom.memberType === "PLAYER" ? "선수" : "용병"}
                          </Badge>
                          {typeof mom.scoreAverage === "number" ? (
                            <span>평점 {mom.scoreAverage.toFixed(1)}</span>
                          ) : null}
                          {mom.goalCount > 0 ? <span>득점 {mom.goalCount}</span> : null}
                          {mom.likeCount > 0 ? <span>좋아요 {mom.likeCount}</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="rounded-full">
                        {summary.club.name}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
