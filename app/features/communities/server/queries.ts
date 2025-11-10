import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

export async function getCommunityBoards() {
  return await prisma.board.findMany({
    where: { isUse: true, clubId: null },
    orderBy: { order: "asc" },
    include: {
      posts: {
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { state: "PUBLISHED" },
        include: {
          _count: {
            select: {
              comments: { where: { parentId: null, isDeleted: false } },
            },
          },
        },
      },
    },
  });
}

export async function getOrCreateDraftPost(userId: string) {
  return await prisma.$transaction(async (tx) => {
    const draftPost = await tx.post.findFirst({
      where: {
        authorId: userId,
        state: "DRAFT",
      },
    });

    if (!draftPost) {
      const post = await tx.post.create({
        data: {
          authorId: userId,
          title: "",
          state: "DRAFT",
        },
      });
      return post;
    }
    return draftPost;
  });
}

export async function getCommunityBoardList() {
  return await prisma.board.findMany({
    where: { isUse: true, clubId: null },
    orderBy: { order: "asc" },
  });
}

export async function findPostWithFiles(postId: string) {
  return await prisma.post.findUnique({
    where: { id: postId },
    include: { files: true },
  });
}

export async function deleteFilesByIds(ids: string[]) {
  if (ids.length === 0) return { count: 0 };
  return await prisma.file.deleteMany({ where: { id: { in: ids } } });
}

export async function updatePostPublish(
  postId: string,
  data: { boardId: string; title: string; contentJSON: unknown },
) {
  return await prisma.post.update({
    where: { id: postId },
    data: {
      boardId: data.boardId,
      state: "PUBLISHED",
      title: data.title,
      content: data.contentJSON as Prisma.InputJsonValue,
      createdAt: new Date(),
    },
  });
}

export async function findBoardById(boardId: string) {
  return await prisma.board.findUnique({ where: { id: boardId } });
}

export async function findPostDetail(postId: string, userId?: string) {
  return await prisma.post.findUnique({
    where: { id: postId },
    include: {
      board: true,
      author: { include: { userImage: true } },
      likes: userId ? { where: { userId } } : true,
      votes: true,
      _count: {
        select: {
          comments: { where: { parentId: null, isDeleted: false } },
          likes: true,
        },
      },
    },
  });
}

export async function softDeletePostByAuthor(postId: string, authorId: string) {
  return await prisma.post.update({
    where: { id: postId, authorId },
    data: { state: "DELETED" },
  });
}

export async function findCommentWithFilesForAuthor(commentId: string, authorId: string) {
  return await prisma.postComment.findUnique({
    where: { id: commentId, authorId },
    include: { files: true },
  });
}

export async function updateCommentContentAndConnectFiles(
  commentId: string,
  authorId: string,
  contentJSON: unknown,
  newImageIds: string[],
) {
  return await prisma.postComment.update({
    where: { id: commentId, authorId },
    data: {
      content: contentJSON as Prisma.InputJsonValue,
      files: { connect: newImageIds.map((id) => ({ id })) },
    },
  });
}

export async function markFilesPermanent(ids: string[]) {
  if (ids.length === 0) return { count: 0 };
  return await prisma.file.updateMany({ where: { id: { in: ids } }, data: { isTemp: false } });
}

export async function softDeleteCommentByAuthor(commentId: string, authorId: string) {
  return await prisma.postComment.update({
    where: { id: commentId, authorId },
    data: { isDeleted: true },
  });
}

// Votes & Likes

export async function upsertPostVote(userId: string, postId: string, vote: -1 | 0 | 1) {
  await prisma.postVote.upsert({
    where: { postId_userId: { postId, userId } },
    update: { vote },
    create: { postId, userId, vote },
  });
  const sum = await prisma.postVote.aggregate({ where: { postId }, _sum: { vote: true } });
  return { vote, sum: sum._sum.vote ?? 0 };
}

export async function upsertCommentVote(userId: string, commentId: string, vote: -1 | 0 | 1) {
  await prisma.commentVote.upsert({
    where: { commentId_userId: { commentId, userId } },
    update: { vote },
    create: { commentId, userId, vote },
  });
  const sum = await prisma.commentVote.aggregate({ where: { commentId }, _sum: { vote: true } });
  // denormalized cache on comment
  await prisma.postComment.update({
    where: { id: commentId },
    data: { voteCount: sum._sum.vote ?? 0 },
  });
  return { vote, sum: sum._sum.vote ?? 0 };
}

export async function likePost(userId: string, postId: string) {
  await prisma.postLike.create({ data: { userId, postId } });
  const [likeCount, liked] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    prisma.postLike.findFirst({ where: { postId, userId } }),
  ]);
  return { liked: Boolean(liked), likeCount };
}

export async function unlikePost(userId: string, postId: string) {
  await prisma.postLike.deleteMany({ where: { userId, postId } });
  const [likeCount, liked] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    prisma.postLike.findFirst({ where: { postId, userId } }),
  ]);
  return { liked: Boolean(liked), likeCount };
}
