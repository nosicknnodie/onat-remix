import { Link } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { SerializedEditorState } from "lexical";
import { FaRegComment } from "react-icons/fa6";
import { Preview } from "~/components/lexical/Preview";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Loading } from "~/components/Loading";
import { PostVoteBadgeButton, Settings } from "~/features/communities/client";

type BoardInfo = {
  clubId?: string | null;
  slug?: string | null;
  name?: string | null;
};

type AuthorInfo = {
  name?: string | null;
  userImage?: {
    url?: string | null;
  } | null;
};

type PostMeta = {
  id: string;
  title: string;
  content: unknown;
  createdAt: string | Date;
  author: AuthorInfo;
  board?: BoardInfo | null;
  _count: {
    comments: number;
  };
};

interface ClubBoardPostCardProps {
  post: PostMeta;
  fallbackBoard?: BoardInfo | null;
}

export function ClubBoardPostCard({ post, fallbackBoard }: ClubBoardPostCardProps) {
  const board = post.board ?? fallbackBoard ?? null;
  const boardLink =
    board?.clubId && board?.slug ? `/clubs/${board.clubId}/boards/${board.slug}` : undefined;
  const postLink =
    board?.clubId && board?.slug
      ? `/clubs/${board.clubId}/boards/${board.slug}/${post.id}`
      : "./" + post.id;

  return (
    <Card className="w-full rounded-2xl shadow-sm border border-muted/40">
      <CardHeader className="gap-2 pb-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={post.author.userImage?.url || "/images/user_empty.png"} />
              <AvatarFallback className="bg-primary-foreground">
                <Loading />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{post.author.name}</span>
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
        <PostVoteBadgeButton post={post as any} />
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
            post={post as any}
            editTo={`/clubs/${board.clubId}/boards/${board.slug}/${post.id}/edit`}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
