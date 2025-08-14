import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { IMatchClubComment } from "~/routes/api+/matchClubs+/$matchClubId+/comments";
import { MatchCommentContext } from "./_context";

export const useMatchCommentContext = () => {
  return useContext(MatchCommentContext);
};

export const useGetMatchCommentsQuery = () => {
  const { matchClubId } = useMatchCommentContext();
  return useQuery<{ comments: IMatchClubComment[] }>({
    queryKey: ["MATCH_CLUB", matchClubId],
    queryFn: async () => {
      const res = await fetch("/api/matchClubs/" + matchClubId + "/comments");
      return await res.json();
    },
    enabled: !!matchClubId,
  });
};

export const useCommentInput = () => {
  const handleInsertImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/comment-image", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  };
  return { handleInsertImage };
};
