import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { ClubLeaderboardItem } from "~/features/clubs/isomorphic";

interface ClubLeaderboardCardProps {
  title: string;
  description?: string;
  items?: ClubLeaderboardItem[];
  emptyMessage: string;
  valueSuffix?: string;
}

export function ClubLeaderboardCard({
  title,
  description,
  items = [],
  emptyMessage,
  valueSuffix,
}: ClubLeaderboardCardProps) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {safeItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          safeItems.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs font-semibold w-5">{index + 1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.imageUrl ?? undefined} alt={item.name} />
                  <AvatarFallback>{item.name?.at?.(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.memberType === "PLAYER" ? "선수" : "용병"}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm font-semibold">
                {item.formattedValue}
                {valueSuffix ? valueSuffix : ""}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
