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
