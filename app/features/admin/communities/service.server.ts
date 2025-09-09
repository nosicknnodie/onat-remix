import type { BoardType, UserRoleType } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

export async function createBoard(input: {
  name: string;
  slug: string;
  type: BoardType;
  order: number;
  readRole: UserRoleType | null;
  writeRole: UserRoleType | null;
}) {
  return prisma.board.create({
    data: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      order: input.order,
      readRole: input.readRole,
      writeRole: input.writeRole,
    },
  });
}
