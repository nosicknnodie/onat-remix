import { cn } from "~/libs";
import { useGetMatchCommentsQuery } from "./_hooks";
import CommentItem from "./CommentItem";

const CommentList = () => {
  const { data } = useGetMatchCommentsQuery();
  const comments = data?.comments;
  return (
    <>
      {comments?.map((comment) => (
        <div key={comment.id} className={cn("")}>
          <CommentItem comment={comment} />
          {comment.replys.map((reply) => (
            <div key={`${comment.id}-${reply.id}`} className={cn("pl-8")}>
              <CommentItem comment={reply} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default CommentList;
