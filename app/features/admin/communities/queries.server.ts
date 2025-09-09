import { prisma } from "~/libs/db/db.server";

export async function listPublicBoards() {
  return prisma.board.findMany({ where: { clubId: null } });
}
