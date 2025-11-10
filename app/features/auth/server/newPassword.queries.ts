import { TokenType } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

/**
 * @purpose 데이터베이스 관련 작업을 격리하여 처리합니다. 서비스 로직은 이 파일의 함수들을 통해
 * 데이터에 접근하므로, DB 구현이 변경되어도 서비스 로직은 영향을 받지 않습니다.
 */

export const findResetToken = (token: string) =>
  prisma.confirmToken.findUnique({
    where: { token, type: TokenType.PASSWORD_RESET },
  });

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const verifyUserEmail = (email: string) =>
  prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

export const updateUserPassword = (email: string, hashedPassword: string) =>
  prisma.key.update({
    where: { id: `email:${email}` },
    data: { hashedPassword },
  });

export const deleteConfirmToken = (tokenId: string) =>
  prisma.confirmToken.delete({ where: { id: tokenId } });
