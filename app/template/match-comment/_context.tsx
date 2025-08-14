import React from "react";

export interface IMatchCommentContextProviderValues {
  matchClubId?: string;
}
export const MatchCommentContext =
  React.createContext<IMatchCommentContextProviderValues>({
    matchClubId: undefined,
  });
