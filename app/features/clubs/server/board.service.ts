import type { Prisma } from "@prisma/client";
import _ from "lodash";
import { deletePublicImage } from "~/libs/db/s3.server";
import {
  countBoards,
  createDefaultBoards,
  createDraftPost,
  deleteFilesByIds,
  findBoardById,
  findBoardBySlug,
  findBoardWithPosts,
  findBoardsOverview,
  findClubPosts,
  findDraftPostByAuthor,
  findPostWithFiles,
  findUsableBoards,
  updatePostToPublished,
} from "./board.queries";

async function ensureDefaultBoards(clubId: string) {
  const total = await countBoards(clubId);
  if (total === 0) {
    await createDefaultBoards(clubId);
  }
}

export async function ensureBoardsForClub(clubId: string) {
  await ensureDefaultBoards(clubId);
}

export async function getBoardsOverview(clubId: string) {
  await ensureDefaultBoards(clubId);
  return await findBoardsOverview(clubId);
}

export async function getBoardTabs(clubId: string) {
  await ensureDefaultBoards(clubId);
  return await findUsableBoards(clubId);
}

export async function getBoardBySlug(clubId: string, slug: string) {
  await ensureDefaultBoards(clubId);
  return await findBoardBySlug(clubId, slug);
}

type BoardFeedParams = {
  clubId: string;
  slug: string;
  take: number;
  cursor?: string | null;
  userId?: string | null;
};

export async function getBoardFeed(params: BoardFeedParams) {
  await ensureDefaultBoards(params.clubId);
  const boardWithPosts = await findBoardWithPosts(params);
  const posts = boardWithPosts?.posts ?? [];
  const hasMore = posts.length > params.take;
  const sliced = hasMore ? posts.slice(0, params.take) : posts;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;
  const mapped = sliced.map((post) => {
    const sumVote = post.votes.reduce((acc, vote) => acc + vote.vote, 0);
    const currentVote = post.votes.find((vote) => vote.userId === params.userId) ?? undefined;
    return {
      ..._.omit(post, "votes"),
      sumVote,
      currentVote,
    };
  });
  return {
    board: boardWithPosts ? { ...boardWithPosts, posts: undefined } : null,
    posts: mapped,
    pageInfo: {
      hasMore,
      nextCursor,
      take: params.take,
    },
  };
}

export async function getDraftPostAndBoards(userId: string, clubId: string) {
  const draft = (await findDraftPostByAuthor(userId)) ?? (await createDraftPost(userId));
  const boards = await findUsableBoards(clubId);
  return { post: draft, boards };
}

export async function getEditablePost(postId: string, userId: string, clubId: string) {
  const post = await findPostWithFiles(postId);
  if (!post || post.authorId !== userId) {
    return null;
  }
  const boards = await findUsableBoards(clubId);
  return { post, boards };
}

function extractImageIds(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const target = node as { [key: string]: unknown };
  let ids: string[] = [];

  if (target.type === "image" && typeof target.imageId === "string") {
    ids.push(target.imageId);
  }

  if (Array.isArray(target.children)) {
    for (const child of target.children) {
      ids = ids.concat(extractImageIds(child));
    }
  }

  if (target.root) {
    ids = ids.concat(extractImageIds(target.root));
  }

  return ids;
}

export async function publishPost({
  postId,
  boardId,
  title,
  content,
  authorId,
  resetCreatedAt = false,
}: {
  postId: string;
  boardId: string;
  title: string;
  content: string;
  authorId: string;
  resetCreatedAt?: boolean;
}) {
  const contentJSON = JSON.parse(content) as Prisma.InputJsonValue;
  const usedImageIds = extractImageIds(contentJSON);
  const post = await findPostWithFiles(postId);
  if (!post || post.authorId !== authorId) {
    throw new Error("UNAUTHORIZED");
  }

  const notUsedImages = post.files.filter((file) => !usedImageIds.includes(file.id));
  const deletedIds: string[] = [];
  for (const file of notUsedImages) {
    try {
      if (file.key) {
        await deletePublicImage(file.key);
      }
      deletedIds.push(file.id);
    } catch (error) {
      console.error("이미지 삭제 실패:", file.key, error);
    }
  }
  if (deletedIds.length > 0) {
    await deleteFilesByIds(deletedIds);
  }

  const updated = await updatePostToPublished({
    postId,
    boardId,
    title,
    content: contentJSON,
    resetCreatedAt,
  });

  return {
    post: updated,
    board: updated.board ?? (await findBoardById(boardId)),
  };
}

type ClubFeedParams = {
  clubId: string;
  take: number;
  cursor?: string | null;
  userId?: string | null;
};

export async function getClubFeed(params: ClubFeedParams) {
  await ensureDefaultBoards(params.clubId);
  const posts = await findClubPosts(params);
  const hasMore = posts.length > params.take;
  const sliced = hasMore ? posts.slice(0, params.take) : posts;
  const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;
  const mapped = sliced.map((post) => {
    const sumVote = post.votes.reduce((acc, vote) => acc + vote.vote, 0);
    const currentVote = post.votes.find((vote) => vote.userId === params.userId) ?? undefined;
    return {
      ..._.omit(post, "votes"),
      sumVote,
      currentVote,
    };
  });

  return {
    posts: mapped,
    pageInfo: {
      hasMore,
      nextCursor,
      take: params.take,
    },
  };
}
