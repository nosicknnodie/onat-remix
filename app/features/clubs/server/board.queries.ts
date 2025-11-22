import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

const DEFAULT_BOARD_DEFINITIONS = [
  { name: "공지사항", slug: "notice", order: 0, type: "NOTICE" },
  { name: "자유게시판", slug: "free", order: 10, type: "TEXT" },
  { name: "갤러리", slug: "gallery", order: 20, type: "GALLERY" },
  { name: "자료실", slug: "archive", order: 30, type: "ARCHIVE" },
] as const;

export function buildDefaultBoards(clubId: string) {
  return DEFAULT_BOARD_DEFINITIONS.map((board) => ({
    ...board,
    clubId,
  }));
}

export async function countBoards(clubId: string) {
  return await prisma.board.count({ where: { clubId } });
}

export async function createDefaultBoards(clubId: string) {
  const data = buildDefaultBoards(clubId);
  await prisma.board.createMany({ data, skipDuplicates: true });
}

export async function findBoardsOverview(clubId: string) {
  return await prisma.board.findMany({
    where: {
      isUse: true,
      clubId,
    },
    include: {
      posts: {
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { state: "PUBLISHED" },
        include: {
          author: {
            include: {
              userImage: true,
            },
          },
          authorPlayer: {
            include: {
              user: {
                include: {
                  userImage: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: { where: { parentId: null, isDeleted: false } },
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function findBoardBySlug(clubId: string, slug: string) {
  return await prisma.board.findFirst({
    where: { clubId, slug },
  });
}

type BoardFeedArgs = {
  clubId: string;
  slug: string;
  take: number;
  cursor?: string | null;
  userId?: string | null;
};

export async function findBoardWithPosts(args: BoardFeedArgs) {
  const { clubId, slug, take, cursor, userId } = args;
  return await prisma.board.findFirst({
    where: {
      slug,
      clubId,
    },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        where: { state: "PUBLISHED" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            include: {
              userImage: true,
            },
          },
          authorPlayer: {
            include: {
              user: {
                include: {
                  userImage: true,
                },
              },
            },
          },
          votes: true,
          likes: {
            where: {
              userId: userId ?? undefined,
            },
            take: 1,
          },
          _count: {
            select: {
              comments: { where: { parentId: null, isDeleted: false } },
              likes: true,
            },
          },
        },
      },
    },
  });
}

export async function findUsableBoards(clubId: string) {
  return await prisma.board.findMany({
    where: { isUse: true, clubId },
    orderBy: { order: "asc" },
  });
}

type ClubFeedArgs = {
  clubId: string;
  take: number;
  cursor?: string | null;
  userId?: string | null;
};

export async function findClubPosts(args: ClubFeedArgs) {
  const { clubId, take, cursor, userId } = args;
  return await prisma.post.findMany({
    where: {
      state: "PUBLISHED",
      board: {
        clubId,
      },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      board: true,
      author: {
        include: {
          userImage: true,
        },
      },
      authorPlayer: {
        include: {
          user: {
            include: {
              userImage: true,
            },
          },
        },
      },
      votes: true,
      likes: {
        where: {
          userId: userId ?? undefined,
        },
        take: 1,
      },
      _count: {
        select: {
          comments: { where: { parentId: null, isDeleted: false } },
          likes: true,
        },
      },
    },
  });
}

export async function findDraftPostByAuthor(authorId: string) {
  return await prisma.post.findFirst({
    where: {
      authorId,
      state: "DRAFT",
    },
  });
}

export async function createDraftPost(authorId: string) {
  return await prisma.post.create({
    data: {
      authorId,
      title: "",
      state: "DRAFT",
    },
  });
}

export async function findPostWithFiles(postId: string) {
  return await prisma.post.findUnique({
    where: { id: postId },
    include: {
      files: true,
    },
  });
}

export async function deleteFilesByIds(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.file.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}

export async function updatePostToPublished({
  postId,
  boardId,
  title,
  content,
  resetCreatedAt,
  authorPlayerId,
}: {
  postId: string;
  boardId: string;
  title: string;
  content: Prisma.InputJsonValue;
  resetCreatedAt?: boolean;
  authorPlayerId?: string | null;
}) {
  return await prisma.post.update({
    where: { id: postId },
    data: {
      boardId,
      state: "PUBLISHED",
      title,
      content,
      authorPlayerId: authorPlayerId ?? null,
      ...(resetCreatedAt ? { createdAt: new Date() } : {}),
    },
    include: {
      board: true,
    },
  });
}

export async function findBoardById(boardId: string) {
  return await prisma.board.findUnique({ where: { id: boardId } });
}
