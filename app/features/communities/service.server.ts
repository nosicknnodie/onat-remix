import { getCommunityBoards as getCommunityBoardsQuery } from "./queries.server";

/**
 * 커뮤니티 메인 페이지의 게시판 목록을 조회
 */
export async function getCommunityBoards() {
  const boards = await getCommunityBoardsQuery();
  return { boards };
}
