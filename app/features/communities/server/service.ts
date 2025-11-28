import { deletePublicImage } from "~/libs/server/db/s3";
import type { ContentNode, NewPostDTO, PublishPostResult } from "../isomorphic/types";
import {
  deleteFilesByIds,
  findBoardById,
  findPostWithFiles,
  getCommunityBoardList,
  getCommunityBoards as getCommunityBoardsQuery,
  getOrCreateDraftPost,
  markFilesPermanent,
  updatePostPublish,
} from "./queries";

/**
 * 커뮤니티 메인 페이지의 게시판 목록을 조회
 */
export async function getCommunityBoards() {
  const boards = await getCommunityBoardsQuery();
  return { boards };
}

/**
 * 커뮤니티 새 글 작성 페이지 데이터 준비
 * - 사용자 초안 포스트 확보 (없으면 생성)
 * - 커뮤니티 보드 목록 조회
 */
export async function getNewPostData(userId: string) {
  const post = await getOrCreateDraftPost(userId);
  const boards = await getCommunityBoardList();
  return { post, boards };
}

/**
 * 새 글 발행 처리
 * - 입력 파싱/검증 → 미사용 이미지 정리 → 포스트 업데이트 → 리다이렉트
 */
export async function publishPost(input: NewPostDTO, userId: string): Promise<PublishPostResult> {
  try {
    const { id, boardId, title, contentJSON } = input;

    const extractImageIds = (node: unknown): string[] => {
      if (!node || typeof node !== "object") return [];
      const n = node as ContentNode;
      let ids: string[] = [];
      if (n.type === "image" && n.imageId) ids.push(n.imageId);
      if (n.root) {
        ids = ids.concat(extractImageIds(n.root));
      } else if (n.children && Array.isArray(n.children)) {
        for (const child of n.children) ids = ids.concat(extractImageIds(child));
      }
      return ids;
    };

    const post = await findPostWithFiles(id);
    if (post?.authorId !== userId) {
      return { ok: false, reason: "forbidden", message: "게시글 권한이 없습니다." };
    }

    const usedImageIds = extractImageIds(contentJSON);
    const notUsedImages = post?.files.filter((file) => !usedImageIds.includes(file.id)) ?? [];

    if (notUsedImages.length > 0) {
      const successfullyDeletedIds: string[] = [];
      for (const file of notUsedImages) {
        try {
          if (file.key) {
            await deletePublicImage(file.key);
            successfullyDeletedIds.push(file.id);
          }
        } catch (err) {
          console.error("이미지 삭제 실패:", file.key, err);
        }
      }
      if (successfullyDeletedIds.length > 0) await deleteFilesByIds(successfullyDeletedIds);
    }

    const updated = await updatePostPublish(id, { boardId, title, contentJSON });
    const board = await findBoardById(boardId);
    return { ok: true, postId: updated.id, boardSlug: board?.slug ?? null };
  } catch (error) {
    console.error(error);
    return { ok: false, reason: "error", message: "Internal Server Error" };
  }
}

export async function getPostDetail(postId: string, userId?: string) {
  const post = await (await import("./queries")).findPostDetail(postId, userId);
  if (!post) return null;
  const sumVote = post.votes.reduce((acc, v) => acc + v.vote, 0);
  const currentVote = post.votes.find((v) => v.userId === userId) ?? undefined;
  return { post: { ...post, sumVote, currentVote } };
}

export async function deletePost(postId: string, userId: string) {
  const { softDeletePostByAuthor } = await import("./queries");
  try {
    const res = await softDeletePostByAuthor(postId, userId);
    return { ok: true as const, postId: res.id };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "삭제 실패" };
  }
}

export async function updateComment(commentId: string, userId: string, contentJSON: unknown) {
  const { findCommentWithFilesForAuthor, updateCommentContentAndConnectFiles } = await import(
    "./queries"
  );
  const current = await findCommentWithFilesForAuthor(commentId, userId);
  if (!current) return { ok: false as const, message: "권한이 없거나 댓글이 없습니다." };

  const extractImageIds = (node: unknown): string[] => {
    if (!node || typeof node !== "object") return [];
    const n = node as ContentNode;
    let ids: string[] = [];
    if (n.type === "image" && n.imageId) ids.push(n.imageId);
    if (n.root) ids = ids.concat(extractImageIds(n.root));
    else if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) ids = ids.concat(extractImageIds(child));
    }
    return ids;
  };
  const usedImageIds = extractImageIds(contentJSON);
  const notUsedImages = current.files.filter((f) => !usedImageIds.includes(f.id));

  if (notUsedImages.length > 0) {
    const successfullyDeletedIds: string[] = [];
    for (const file of notUsedImages) {
      try {
        if (file.key) {
          await deletePublicImage(file.key);
          successfullyDeletedIds.push(file.id);
        }
      } catch (err) {
        console.error("이미지 삭제 실패:", file.key, err);
      }
    }
    if (successfullyDeletedIds.length > 0) await deleteFilesByIds(successfullyDeletedIds);
  }

  const newImageIds = usedImageIds.filter((id) => !current.files.some((f) => f.id === id));
  const updated = await updateCommentContentAndConnectFiles(
    commentId,
    userId,
    contentJSON,
    newImageIds,
  );
  if (newImageIds.length > 0) await markFilesPermanent(newImageIds);
  return { ok: true as const, commentId: updated.id };
}

export async function deleteComment(commentId: string, userId: string) {
  const { softDeleteCommentByAuthor } = await import("./queries");
  try {
    const res = await softDeleteCommentByAuthor(commentId, userId);
    return { ok: true as const, commentId: res.id };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "삭제 실패" };
  }
}

export async function votePost(userId: string, postId: string, vote: -1 | 0 | 1) {
  const { upsertPostVote } = await import("./queries");
  if (![-1, 0, 1].includes(vote)) {
    return { ok: false as const, status: 400, message: "Invalid vote value" };
  }
  const res = await upsertPostVote(userId, postId, vote);
  return { ok: true as const, ...res };
}

export async function voteComment(userId: string, commentId: string, vote: -1 | 0 | 1) {
  const { upsertCommentVote } = await import("./queries");
  if (![-1, 0, 1].includes(vote)) {
    return { ok: false as const, status: 400, message: "Invalid vote value" };
  }
  const res = await upsertCommentVote(userId, commentId, vote);
  return { ok: true as const, ...res };
}

export async function togglePostLike(
  userId: string,
  postId: string,
  actionType: "like" | "unlike",
) {
  const { likePost, unlikePost } = await import("./queries");
  const op = actionType === "like" ? likePost : unlikePost;
  const res = await op(userId, postId);
  return { ok: true as const, ...res };
}
