import dayjs from "dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "~/components/ui/Link";
import type { ClubNoticeItem } from "~/features/clubs/types";

interface ClubNoticeListProps {
  clubId: string;
  notices: ClubNoticeItem[];
}

export function ClubNoticeList({ clubId, notices }: ClubNoticeListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>클럽 공지사항</CardTitle>
        <CardDescription>최근 등록된 공지를 확인하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {notices.length === 0 ? (
          <p className="text-muted-foreground">등록된 공지사항이 없습니다.</p>
        ) : (
          notices.map((notice) => {
            const href = notice.boardSlug
              ? `/clubs/${clubId}/boards/${notice.boardSlug}/${notice.id}`
              : `/clubs/${clubId}/boards/notice/${notice.id}`;
            return (
              <div key={notice.id} className="space-y-1">
                <Link to={href} className="font-medium">
                  {notice.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {dayjs(notice.createdAt).format("YYYY-MM-DD HH:mm")}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
