import { MatchCommentContext } from "./_context";

interface IMatchCommentContextProviderProps extends React.PropsWithChildren {
  matchClubId: string;
}
export const MatchCommentContextProvider = ({
  children,
  ...props
}: IMatchCommentContextProviderProps) => {
  return <MatchCommentContext.Provider value={props}>{children}</MatchCommentContext.Provider>;
};
