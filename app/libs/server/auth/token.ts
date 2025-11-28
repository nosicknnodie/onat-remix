/** biome-ignore-all lint/complexity/useDateNow: off */
import { TokenType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "~/libs/server/db/db";

/**
 * 패스워드 리셋토큰 생성
 * @param email
 * @returns
 */
export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();

  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await prisma.confirmToken.findFirst({
    where: { email, type: TokenType.PASSWORD_RESET },
  });

  if (existingToken) {
    await prisma.confirmToken.delete({
      where: { id: existingToken.id },
    });
  }

  const passwordResetToken = await prisma.confirmToken.create({
    data: {
      email,
      token,
      expires,
      type: TokenType.PASSWORD_RESET,
    },
  });

  return passwordResetToken;
};

/**
 * 이메일 체크 확인 토큰 조회
 * @param token
 * @returns
 */
export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.confirmToken.findUnique({
      where: { token, type: TokenType.VERIFICATION },
    });

    return verificationToken;
  } catch {
    return null;
  }
};

/**
 * 이메일 체크 확인 토큰 생성
 * @param email
 * @returns
 */
export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await prisma.confirmToken.findFirst({
    where: { email, type: TokenType.VERIFICATION },
  });

  if (existingToken) {
    await prisma.confirmToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const verficationToken = await prisma.confirmToken.create({
    data: {
      email,
      token,
      expires,
      type: TokenType.VERIFICATION,
    },
  });

  return verficationToken;
};
