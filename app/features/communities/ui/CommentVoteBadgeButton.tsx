import type { CommentVote, File, PostComment, User } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { FaRegThumbsDown, FaRegThumbsUp, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts";
import { cn } from "~/libs";

type PostCommentWithExtras = PostComment & {
  author: User & { userImage: File | null };
  sumVote: number;
  currentVote?: CommentVote | null;
};

const CommentVoteBadgeButton = ({ comment }: { comment: PostCommentWithExtras }) => {
  const fetcher = useFetcher<{ sum: number; vote: number }>();
  const [vote, setVote] = useState(comment.currentVote?.vote ?? 0);
  const [score, setScore] = useState(comment.sumVote);
  const user = useSession();
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
      { commentId: comment.id, vote: newVote },
      { method: "POST", action: "/api/comment-vote" },
    );
  };
  return (
    <Badge variant={"outline"} className={cn("space-x-0.5 border-0 px-0")}>
      <Button
        variant={"ghost"}
        size={"icon"}
        disabled={isDisabled}
        onClick={() => handleVote(1)}
        className={cn("rounded-full hover:text-primary hover:bg-primary/10", {
          "text-primary": vote === 1,
        })}
      >
        {vote === 1 ? <FaThumbsUp /> : <FaRegThumbsUp />}
      </Button>
      <span className="text-gray-500">{score}</span>
      <Button
        variant={"ghost"}
        size={"icon"}
        onClick={() => handleVote(-1)}
        disabled={isDisabled}
        className={cn("rounded-full hover:text-destructive hover:bg-destructive/10", {
          "text-destructive": vote === -1,
        })}
      >
        {vote === -1 ? <FaThumbsDown /> : <FaRegThumbsDown />}
      </Button>
    </Badge>
  );
};

export default CommentVoteBadgeButton;
