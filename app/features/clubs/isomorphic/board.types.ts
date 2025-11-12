import type { getBoardFeed, getClubFeed } from "../server/board.service";

type ClubFeed = Awaited<ReturnType<typeof getClubFeed>>;
type BoardFeed = Awaited<ReturnType<typeof getBoardFeed>>;

type ClubFeedPost = ClubFeed["posts"][number];
type BoardFeedPost = BoardFeed["posts"][number];

export type ClubBoardFeedPost = ClubFeedPost | (BoardFeedPost & { board?: ClubFeedPost["board"] });

export type ClubBoardFeedResponse = {
  posts: ClubBoardFeedPost[];
  pageInfo: ClubFeed["pageInfo"];
};
export type ClubBoardFeedPageInfo = ClubBoardFeedResponse["pageInfo"];
export type ClubBoardFeedQueryKey = readonly ["club", string, "board", "feed", string];
