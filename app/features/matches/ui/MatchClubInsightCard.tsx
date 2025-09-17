import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { MatchClubSummary } from "~/features/matches/types";

interface MatchClubInsightCardProps {
  summary: MatchClubSummary;
}

export const MatchClubInsightCard = ({ summary }: MatchClubInsightCardProps) => {
  const attendanceTotal = summary.attendance.total;
  const voted = summary.attendance.voted;
  const checkedIn = summary.attendance.checkedIn;
  const attendanceRate = attendanceTotal === 0 ? 0 : Math.round((voted / attendanceTotal) * 100);
  const checkRate = attendanceTotal === 0 ? 0 : Math.round((checkedIn / attendanceTotal) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{summary.club.name}</CardTitle>
        <CardDescription>클럽 상세 지표</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">득점</p>
            <p className="text-2xl font-semibold text-primary">{summary.goals.scored}</p>
            <p className="text-xs text-muted-foreground">자책 {summary.goals.ownCommitted}</p>
          </div>
          <div>
            <p className="text-muted-foreground">실점</p>
            <p className="text-2xl font-semibold">{summary.goals.conceded}</p>
            <p className="text-xs text-muted-foreground">상대 자책 {summary.goals.ownReceived}</p>
          </div>
          <div>
            <p className="text-muted-foreground">참석</p>
            <p className="text-2xl font-semibold">{voted}</p>
            <p className="text-xs text-muted-foreground">참석률 {attendanceRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">출석</p>
            <p className="text-2xl font-semibold">{checkedIn}</p>
            <p className="text-xs text-muted-foreground">출석률 {checkRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
