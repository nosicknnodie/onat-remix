import type { File, Post, User } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { AiFillLike } from "react-icons/ai";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

type PostWithExtras = Post & {
  author: (User & { userImage: File | null }) | null;
  likes: { id: string; userId: string | null; postId: string; createdAt: Date }[];
  _count: { comments: number; likes: number };
};

export const PostLikeBadgeButton = ({ post }: { post: PostWithExtras }) => {
  const fetcher = useFetcher<{ success: boolean; liked: boolean; likeCount: number }>();
  const isLikedInitially = post.likes.length > 0;
  const [liked, setLiked] = useState(isLikedInitially);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setLiked(fetcher.data.liked);
      setLikeCount(fetcher.data.likeCount);
    }
  }, [fetcher.state, fetcher.data]);
  const handleClick = () => {
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikeCount((prev) => prev + (optimisticLiked ? 1 : -1));
    fetcher.submit(
      { postId: post.id, actionType: optimisticLiked ? "like" : "unlike" },
      { method: "POST", action: "/api/post-like" },
    );
  };
  return (
    <Button variant={"ghost"} size={"icon"} onClick={handleClick} className="w-fit h-fit">
      <Badge variant={liked ? "default" : "outline"} className="space-x-2">
        <AiFillLike />
        <span>{likeCount}</span>
      </Badge>
    </Button>
  );
};
