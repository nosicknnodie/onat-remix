import { prisma } from "~/libs/server/db/db";
import type { NewBoardInput } from "../isomorphic/types";

export async function listPublicBoards() {
  return prisma.board.findMany({ where: { clubId: null } });
}

export async function createBoard(data: NewBoardInput) {
  return prisma.board.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type,
      order: data.order,
      readRole: data.readRole,
      writeRole: data.writeRole,
    },
  });
}
