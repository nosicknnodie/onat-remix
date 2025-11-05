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
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MdEventAvailable className="text-primary" />
            참석: {attend.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderItems(attend, "아직 참석 인원이 없습니다.", (item) =>
            item.type === "MERCENARY" ? (
              <Badge variant="outline" className="rounded-full">
                용병
              </Badge>
            ) : null,
          )}
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

      <Card className="bg-muted/30">
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
