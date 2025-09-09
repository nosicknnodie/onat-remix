import { MatchCommentContextProvider } from "./_providers";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

interface ICommentSectionProps {
  matchClubId?: string;
}

const CommentSection = ({ matchClubId }: ICommentSectionProps) => {
  if (!matchClubId) return null;
  return (
    <MatchCommentContextProvider matchClubId={matchClubId}>
      <div className="py-2 space-y-2">
        <CommentInput />
        <CommentList />
      </div>
    </MatchCommentContextProvider>
  );
};

export default CommentSection;
