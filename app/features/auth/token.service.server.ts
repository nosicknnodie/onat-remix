import { TokenType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "~/libs/db/db.server";
import * as repo from "./token.repo.server";

/**
 * 이메일 체크 확인 토큰 조회
 * @param token
 * @returns
 */
export async function issueVerificationToken(email: string) {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600_000);

  // 필요 시 트랜잭션으로 안전하게 교체
  return prisma.$transaction(async () => {
    const existing = await repo.findTokenByEmail(email, TokenType.VERIFICATION);
    if (existing) await repo.deleteTokenById(existing.id);
    return repo.createToken({
      email,
      token,
      expires,
      type: TokenType.VERIFICATION,
    });
  });
}

/**
 * 패스워드 리셋토큰 생성
 * @param email
 * @returns
 */
export async function issuePasswordResetToken(email: string) {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600_000);

  return prisma.$transaction(async () => {
    const existing = await repo.findTokenByEmail(
      email,
      TokenType.PASSWORD_RESET
    );
    if (existing) await repo.deleteTokenById(existing.id);
    return repo.createToken({
      email,
      token,
      expires,
      type: TokenType.PASSWORD_RESET,
    });
  });
}

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

export { findVerificationByToken } from "./token.repo.server";
