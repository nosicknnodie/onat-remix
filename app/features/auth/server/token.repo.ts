import { TokenType } from "@prisma/client";
import { prisma } from "~/libs/index.server";

export function findTokenByEmail(email: string, type: TokenType) {
  return prisma.confirmToken.findFirst({ where: { email, type } });
}

export function deleteTokenById(id: string) {
  return prisma.confirmToken.delete({ where: { id } });
}

export function createToken(data: {
  email: string;
  token: string;
  expires: Date;
  type: TokenType;
}) {
  return prisma.confirmToken.create({ data });
}

export function findVerificationByToken(token: string) {
  return prisma.confirmToken.findUnique({
    where: { token, type: TokenType.VERIFICATION },
  });
}
