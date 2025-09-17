import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { ClubInfoData } from "~/features/clubs/types";

interface ClubInfoAttendanceCardProps {
  attendance: ClubInfoData["attendance"];
}

export function ClubInfoAttendanceCard({ attendance }: ClubInfoAttendanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>올해 출석 현황</CardTitle>
        <CardDescription>연간 출석 및 참석률</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">총 참석</p>
          <p className="text-2xl font-semibold">{attendance.voted}</p>
          <p className="text-xs text-muted-foreground">참석률 {attendance.voteRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">총 출석</p>
          <p className="text-2xl font-semibold">{attendance.checkedIn}</p>
          <p className="text-xs text-muted-foreground">출석률 {attendance.checkRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">등록 인원</p>
          <p className="text-2xl font-semibold">{attendance.total}</p>
          <p className="text-xs text-muted-foreground">참석 요청 대비</p>
        </div>
      </CardContent>
    </Card>
  );
}
