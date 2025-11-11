import { useContext } from "react";
import {
  useCommentImageUpload,
  useCreateMatchCommentMutation,
  useMatchCommentsQuery,
} from "~/features/matches/isomorphic";
import { MatchCommentContext } from "./_context";

export const useMatchCommentContext = () => useContext(MatchCommentContext);

export const useGetMatchCommentsQuery = () => {
  const { matchClubId } = useMatchCommentContext();
  return useMatchCommentsQuery(matchClubId);
};

export const useCommentInput = () => {
  return useCommentImageUpload();
};

export const useCreateMatchComment = () => {
  return useCreateMatchCommentMutation();
};
