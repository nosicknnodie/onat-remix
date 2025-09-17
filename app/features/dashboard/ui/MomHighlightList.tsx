import dayjs from "dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { DashboardMom } from "~/features/dashboard/types";

interface MomHighlightListProps {
  title: string;
  description?: string;
  emptyMessage: string;
  items: DashboardMom[];
}

export const MomHighlightList = ({
  title,
  description,
  emptyMessage,
  items,
}: MomHighlightListProps) => {
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
          items.map((item) => (
            <div
              key={`${item.matchId}-${item.matchClubId}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.mom.imageUrl ?? undefined} alt={item.mom.name} />
                  <AvatarFallback>{item.mom.name.at(0) ?? "M"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{item.mom.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.clubName} · {dayjs(item.stDate).format("M월 D일 ddd")}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {typeof item.mom.scoreAverage === "number" ? (
                  <p>평점 {item.mom.scoreAverage.toFixed(1)}</p>
                ) : null}
                {item.mom.goalCount > 0 ? <p>득점 {item.mom.goalCount}</p> : null}
                {item.mom.likeCount > 0 ? <p>좋아요 {item.mom.likeCount}</p> : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
