import { prisma } from "~/libs/db/db.server";

export async function findKeyByEmail(email: string) {
  return prisma.key.findUnique({
    where: { id: `email:${email}` },
    include: { user: true },
  });
}
