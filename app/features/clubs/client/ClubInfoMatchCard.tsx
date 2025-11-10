import dayjs from "dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { ClubMatchHighlight } from "~/features/clubs/isomorphic";

interface ClubInfoMatchCardProps {
  title: string;
  match: ClubMatchHighlight | null;
  emptyMessage: string;
}

export function ClubInfoMatchCard({ title, match, emptyMessage }: ClubInfoMatchCardProps) {
  const summary = match?.summary;
  const attendance = summary?.attendance;
  const goals = summary?.goals;
  const opponents = match?.opponents ?? [];
  const hasMatch = Boolean(match && summary);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hasMatch ? (
          <CardDescription>
            {dayjs(match!.stDate).format("YYYY년 M월 D일 (ddd) HH:mm")}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {hasMatch ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-base">{match!.title}</p>
                <p className="text-muted-foreground text-xs">{match!.placeName ?? "장소 미정"}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{goals?.scored ?? 0}</span>
                <span className="text-muted-foreground text-sm"> : {goals?.conceded ?? 0}</span>
                <p className="text-xs text-muted-foreground">
                  출석 {attendance?.voted ?? 0}/{attendance?.total ?? 0}
                </p>
              </div>
            </div>
            {opponents.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                상대팀: {opponents.map((opponent) => opponent.clubName).join(", ")}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
