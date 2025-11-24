import type { ReactNode } from "react";
import { FaQuestionCircle, FaTimesCircle } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type SummaryItemType = "PLAYER" | "MERCENARY";

export type AttendanceSummaryItem = {
  id: string;
  name: string;
  type: SummaryItemType;
};

export type PendingSummaryItem = {
  id: string;
  name: string;
};

interface PreMatchAttendanceSummaryProps {
  attend: AttendanceSummaryItem[];
  absent: AttendanceSummaryItem[];
  pending: PendingSummaryItem[];
}

const renderItems = <T extends { id: string; name: string }>(
  items: T[],
  emptyLabel: string,
  renderBadge?: (item: T) => ReactNode,
) => {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <span className="font-medium">{item.name}</span>
          {renderBadge ? renderBadge(item) : null}
        </div>
      ))}
    </div>
  );
};

export const PreMatchAttendanceSummary = ({
  attend,
  absent,
  pending,
}: PreMatchAttendanceSummaryProps) => {
  const attendPlayers = attend.filter((item) => item.type === "PLAYER");
  const attendMercenaries = attend.filter((item) => item.type === "MERCENARY");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MdEventAvailable className="text-primary" />
            {`참석: 총 ${attend.length}명 (멤버 ${attendPlayers.length}명, 용병 ${attendMercenaries.length}명)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                멤버 참석 ({attendPlayers.length})
              </p>
              {renderItems(attendPlayers, "아직 참석 인원이 없습니다.")}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                용병 참석 ({attendMercenaries.length})
              </p>
              {renderItems(attendMercenaries, "참석 용병이 없습니다.")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FaTimesCircle className="text-destructive" />
            불참: {absent.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderItems(absent, "불참 인원이 없습니다.", (item) =>
            item.type === "MERCENARY" ? (
              <Badge variant="outline" className="rounded-full">
                용병
              </Badge>
            ) : null,
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FaQuestionCircle className="text-muted-foreground" />
            선택안함: {pending.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderItems(pending, "모든 인원이 참석 여부를 선택했습니다.", () => null)}
        </CardContent>
      </Card>
    </div>
  );
};
