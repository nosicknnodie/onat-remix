import type { Prisma } from "@prisma/client";
import { prisma } from "~/libs/server/db/db";

const userInclude = {
  user: {
    include: {
      userImage: true,
    },
  },
} satisfies Prisma.KeyInclude;

export async function findKeyById(id: string) {
  return prisma.key.findUnique({
    where: { id },
    include: userInclude,
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      userImage: true,
    },
  });
}

export async function createUserWithKey(args: {
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  providerKeyId: string;
}) {
  const emailVerifiedAt = args.emailVerified ? new Date() : null;
  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdUser = await tx.user.create({
      data: {
        email: args.email,
        name: args.name ?? null,
        emailVerified: emailVerifiedAt,
      },
    });

    await tx.key.create({
      data: {
        id: args.providerKeyId,
        userId: createdUser.id,
      },
    });

    return createdUser;
  });

  return prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userImage: true,
    },
  });
}

export async function createKeyForUser(args: { providerKeyId: string; userId: string }) {
  await prisma.key.create({
    data: {
      id: args.providerKeyId,
      userId: args.userId,
    },
  });
}

export async function markUserEmailVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
    },
  });
}

export async function updateUserName(userId: string, name: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
}
