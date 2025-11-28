import { prisma } from "~/libs/server";

export async function getEditUser(userId: string) {
  return await prisma.user.findUnique({ where: { id: userId } });
}
