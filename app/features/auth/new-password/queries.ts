import { TokenType } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";

/**
 * @purpose 이 파일은 데이터베이스 관련 작업을 격리하여 처리합니다.
 * 서비스 로직이 직접 Prisma에 의존하는 대신, 이 파일에 정의된 함수들을 통해 데이터에 접근합니다.
 * 이를 통해 데이터베이스 로직의 재사용성을 높이고, 서비스 로직을 테스트할 때
 * 데이터베이스 부분을 쉽게 모킹(mocking)할 수 있습니다.
 */

/**
 * 주어진 토큰 문자열로 PASSWORD_RESET 타입의 토큰을 찾습니다.
 */
export const findResetToken = async (token: string) => {
  return prisma.confirmToken.findUnique({
    where: { token, type: TokenType.PASSWORD_RESET },
  });
};

/**
 * 이메일로 사용자를 찾습니다.
 */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * 사용자의 이메일 인증 상태를 현재 시간으로 업데이트합니다.
 */
export const verifyUserEmail = async (email: string) => {
  return prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });
};

/**
 * 사용자의 비밀번호를 새로운 해시값으로 업데이트합니다.
 */
export const updateUserPassword = async (email: string, hashedPassword: string) => {
  // Lucia-auth v2+ 에서는 Key 테이블에 비밀번호가 저장됩니다.
  return prisma.key.update({
    where: { id: `email:${email}` },
    data: { hashedPassword },
  });
};

/**
 * 사용된 확인 토큰을 데이터베이스에서 삭제합니다.
 */
export const deleteConfirmToken = async (tokenId: string) => {
  return prisma.confirmToken.delete({
    where: { id: tokenId },
  });
};
