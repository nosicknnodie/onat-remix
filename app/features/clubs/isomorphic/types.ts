/**
 * 클럽 기능의 타입 정의
 * - 클럽 도메인의 모든 타입을 중앙 집중식으로 관리
 * - Prisma 타입을 기반으로 한 확장된 클럽 타입 정의
 */

import type { Board, CommentVote, File, Player, PostComment, Prisma, User } from "@prisma/client";
import type { service as communityService } from "~/features/communities/server";
import type { MatchClubSummary } from "~/features/matches/isomorphic";
import type { infoService, service } from "../server";

// 클럽 이미지와 엠블럼을 포함한 확장된 클럽 타입
export type Club = Prisma.ClubGetPayload<{
  include: {
    image: true;
    emblem: true;
  };
}>;

export type { Player };

export type ClubWithMembership = Club & {
  membership: Player | null;
};
// 클럽 카테고리별 분류 타입
export type CategorizedClubs = {
  my: Club[]; // 내가 속한 클럽들
  public: Club[]; // 공개 클럽들
};

// 클럽 목록 조회 결과 타입
export type ClubsData = {
  categorized: CategorizedClubs;
  players: Player[];
};

// 클럽 리스트 컴포넌트 Props 타입
export type ClubListProps = {
  clubs: Club[];
  players: Player[];
};

// 개별 클럽 카드 컴포넌트 Props 타입
export type ClubCardProps = {
  club: Club;
  membership?: Player | null;
};

export type IPlayer = Awaited<ReturnType<typeof service.getClubMembers>>[number];
export type IClubLayoutLoaderData = Awaited<ReturnType<typeof infoService.getClubLayoutData>>;

export type ClubMatchHighlight = {
  matchId: string;
  matchClubId: string;
  title: string;
  stDate: string;
  placeName?: string | null;
  summary: MatchClubSummary;
  opponents: Array<{ clubName: string }>;
};

export type ClubLeaderboardItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  memberType: "PLAYER" | "MERCENARY";
  value: number;
  formattedValue: string;
};

export type ClubNoticeItem = {
  id: string;
  title: string;
  createdAt: string;
  boardSlug?: string | null;
  boardName?: string | null;
};

export type ClubInfoData = {
  recentMatch: ClubMatchHighlight | null;
  upcomingMatch: ClubMatchHighlight | null;
  attendance: {
    total: number;
    voted: number;
    checkedIn: number;
    voteRate: number;
    checkRate: number;
  };
  goalLeaders: ClubLeaderboardItem[];
  ratingLeaders: ClubLeaderboardItem[];
  notices: ClubNoticeItem[];
};

export type ClubBoardTabs = Board[];

export type ClubBoardPostComment = PostComment & {
  author: User & {
    userImage: File | null;
  };
  authorPlayer:
    | (Player & {
        user: (User & { userImage: File | null }) | null;
      })
    | null;
  sumVote: number;
  currentVote: CommentVote | null;
};

export type ClubBoardCommentTreeNode = ClubBoardPostComment & {
  children: ClubBoardCommentTreeNode[];
};

export type ClubBoardCommentsResponse = {
  comments: ClubBoardCommentTreeNode[];
  success: boolean;
  isMobile: boolean;
  limitDepth: number;
  startDepth: number;
};

type CommunityService = typeof communityService;
type PostDetailResult = Awaited<ReturnType<CommunityService["getPostDetail"]>>;

export type ClubBoardPostDetail = NonNullable<PostDetailResult>;
