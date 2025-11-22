import { Link } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { SerializedEditorState } from "lexical";
import { FaRegComment } from "react-icons/fa6";
import { Loading } from "~/components/Loading";
import { Preview } from "~/components/lexical/Preview";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type { ClubBoardFeedPost } from "~/features/clubs/isomorphic";
import { PostVoteBadgeButton, Settings } from "~/features/communities/client";
import { getPlayerDisplayName } from "~/features/matches/isomorphic";

interface ClubBoardPostCardProps {
  post: ClubBoardFeedPost;
  fallbackBoard?: Partial<ClubBoardFeedPost["board"]> | null;
  onDeleted?: (postId: string) => void;
}

export function ClubBoardPostCard({ post, fallbackBoard, onDeleted }: ClubBoardPostCardProps) {
  const board = post.board ?? fallbackBoard ?? null;
  const boardLink =
    board?.clubId && board?.slug ? `/clubs/${board.clubId}/boards/${board.slug}` : undefined;
  const postLink =
    board?.clubId && board?.slug
      ? `/clubs/${board.clubId}/boards/${board.slug}/${post.id}`
      : `./${post.id}`;
  const authorPlayer = post.authorPlayer;
  const authorName =
    getPlayerDisplayName(authorPlayer ?? undefined) ??
    post.author?.nick ??
    post.author?.name ??
    "알 수 없는 사용자";
  const authorImageUrl =
    authorPlayer?.user?.userImage?.url ?? post.author?.userImage?.url ?? "/images/user_empty.png";

  return (
    <Card className="w-full rounded-2xl shadow-sm border border-muted/40">
      <CardHeader className="gap-2 pb-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={authorImageUrl} />
              <AvatarFallback className="bg-primary-foreground">
                <Loading />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{authorName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {boardLink ? (
              <Link to={boardLink} className="text-primary font-semibold">
                {board?.name ?? "게시판"}
              </Link>
            ) : (
              <span className="text-primary font-semibold">{board?.name ?? "게시판"}</span>
            )}
            <Separator orientation="vertical" className="h-4" />
            <span>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
        </div>
        <CardTitle className="text-2xl">
          <Link to={postLink}>{post.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <Link to={postLink}>
          <Preview editorState={post.content as unknown as SerializedEditorState} />
        </Link>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <PostVoteBadgeButton post={post} />
        <Badge variant="outline" className="space-x-2">
          <Button variant="ghost" size="icon" className="h-4 w-4" asChild>
            <Link to={postLink}>
              <FaRegComment />
            </Link>
          </Button>
          <span>{post._count.comments}</span>
        </Badge>
        {board?.clubId && board?.slug ? (
          <Settings
            post={post}
            editTo={`/clubs/${board.clubId}/boards/${board.slug}/${post.id}/edit`}
            onDeleted={onDeleted}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
