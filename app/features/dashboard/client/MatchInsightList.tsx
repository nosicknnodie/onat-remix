import dayjs from "dayjs";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { DashboardMatchInsight } from "~/features/dashboard/isomorphic";

interface MatchInsightListProps {
  title: string;
  description?: string;
  emptyMessage: string;
  items: DashboardMatchInsight[];
}

const formatDate = (date: string) => dayjs(date).format("M월 D일 ddd HH:mm");

export const MatchInsightList = ({
  title,
  description,
  emptyMessage,
  items,
}: MatchInsightListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const attendanceState = item.userAttendance
              ? item.userAttendance.isVote
                ? "응답 완료"
                : "응답 필요"
              : "미등록";
            const attendanceVariant = item.userAttendance?.isVote ? "outline" : "secondary";
            return (
              <div
                key={`${item.matchId}-${item.matchClubId}`}
                className="space-y-2 rounded-md border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.matchTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.stDate)} · {item.placeName ?? "장소 미정"}
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {item.summary.goals.scored}
                    <span className="text-muted-foreground"> : {item.summary.goals.conceded}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={attendanceVariant}>{attendanceState}</Badge>
                  <span>
                    출석 {item.summary.attendance.voted}/{item.summary.attendance.total}
                  </span>
                  {item.opponents.length > 0 ? (
                    <span>
                      상대 {item.opponents.map((opponent) => opponent.clubName).join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
