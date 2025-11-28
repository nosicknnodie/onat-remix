import { prisma } from "~/libs/server";

export async function findKeyByEmail(email: string) {
  return prisma.key.findUnique({
    where: { id: `email:${email}` },
    include: { user: true },
  });
}

export async function setNameById(id: string, name: string) {
  return prisma.user.update({
    where: { id },
    data: { name },
  });
}

export async function setHashedPasswordByEmail(email: string, hashedPassword: string) {
  return prisma.key.update({
    where: { id: `email:${email}` },
    data: { hashedPassword },
  });
}
