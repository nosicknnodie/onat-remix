import type { SerializedEditorState } from "lexical";
import type { IMatchClubComment } from "~/routes/api+/matchClubs+/$matchClubId+/comments";

export type MatchClubComment = IMatchClubComment;
export type MatchClubCommentsResponse = { comments: MatchClubComment[] };

export type CreateMatchClubCommentInput = {
  matchClubId: string;
  content?: SerializedEditorState;
  parentId?: string | null;
  replyToUserId?: string | null;
};

export type CreateMatchClubCommentResponse = {
  comment: MatchClubComment;
};
