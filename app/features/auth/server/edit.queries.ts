import { prisma } from "~/libs/index.server";

export async function getEditUser(userId: string) {
  return await prisma.user.findUnique({ where: { id: userId } });
}
