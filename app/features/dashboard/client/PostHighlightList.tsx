import dayjs from "dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "~/components/ui/Link";
import type { DashboardPost } from "~/features/dashboard/isomorphic";

interface PostHighlightListProps {
  title: string;
  description?: string;
  emptyMessage: string;
  items: DashboardPost[];
}

export const PostHighlightList = ({
  title,
  description,
  emptyMessage,
  items,
}: PostHighlightListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const href = item.boardClubId
              ? `/clubs/${item.boardClubId}/boards/${item.boardSlug ?? "notice"}/${item.id}`
              : item.boardSlug
                ? `/communities/${item.boardSlug}/${item.id}`
                : `#`;
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={href} className="font-medium">
                    {item.title}
                  </Link>
                  {item.isMine ? (
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                      내 글
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.boardName ?? "게시판"}
                  {item.clubName ? ` · ${item.clubName}` : ""} ·{" "}
                  {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
