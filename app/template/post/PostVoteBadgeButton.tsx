import { File, Post, PostVote, User } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts/AuthUserContext";
type PostWithExtras = Post & {
  author: User & {
    userImage: File | null;
  };
  sumVote: number;
  currentVote?: PostVote;
  likes: {
    id: string; // PostLike 테이블의 id
    userId: string;
    postId: string;
    createdAt: Date;
  }[]; // 현재 로그인한 유저의 좋아요가 있을 경우 배열로
  _count: {
    comments: number;
    likes: number;
  };
};

interface IPostVoteBadgeButtonProps {
  post: PostWithExtras;
}

const PostVoteBadgeButton = ({ post }: IPostVoteBadgeButtonProps) => {
  const user = useSession();
  const fetcher = useFetcher<{ sum: number; vote: number }>();
  const [vote, setVote] = useState(post.currentVote?.vote ?? 0);
  const [score, setScore] = useState(post.sumVote);
  const isDisabled = !user;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setVote(fetcher.data.vote);
      setScore(fetcher.data.sum);
    }
  }, [fetcher.state, fetcher.data]);

  const handleVote = (value: number) => {
    const newVote = vote === value ? 0 : value;
    fetcher.submit(
      {
        postId: post.id,
        vote: newVote,
      },
      { method: "POST", action: "/api/post-vote" }
    );
  };

  return (
    <>
      <Badge
        variant={
          vote === 1 ? "default" : vote === -1 ? "destructive" : "outline"
        }
        className="space-x-2 w-fit h-fit"
      >
        <Button
          variant={"ghost"}
          size={"icon"}
          disabled={isDisabled}
          onClick={() => handleVote(1)}
          className="w-fit h-fit hover:text-primary hover:bg-transparent"
        >
          {vote === 1 ? <FaThumbsUp /> : <FaRegThumbsUp />}
        </Button>
        <span>{score}</span>
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => handleVote(-1)}
          disabled={isDisabled}
          className="w-fit h-fit hover:text-destructive hover:bg-transparent"
        >
          {vote === -1 ? <FaThumbsDown /> : <FaRegThumbsDown />}
        </Button>
      </Badge>
    </>
  );
};

export default PostVoteBadgeButton;
