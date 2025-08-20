import { prisma } from "~/libs/db/db.server";
import { issuePasswordResetToken } from "../core/token.service.server";

/**
 * @purpose 이 파일은 데이터베이스와 관련된 작업을 처리하는 함수들을 모아놓은 곳입니다.
 * 서비스 로직에서 직접 Prisma 클라이언트를 호출하는 대신, 여기서 정의된 함수를 통해 데이터에 접근합니다.
 * 이렇게 하면 데이터베이스 로직이 한 곳에 집중되어 관리가 용이해지고, 테스트 시 데이터베이스를 모킹(mocking)하기 쉬워집니다.
 */

/**
 * 이메일 주소를 기반으로 사용자를 찾습니다.
 * @param email - 찾고자 하는 사용자의 이메일
 * @returns 사용자가 존재하면 사용자 객체를, 그렇지 않으면 null을 반환합니다.
 */
export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

/**
 * 특정 이메일 주소에 대한 비밀번호 재설정 토큰을 생성하고 데이터베이스에 저장합니다.
 * @param email - 토큰을 생성할 사용자의 이메일
 * @returns 생성된 비밀번호 재설정 토큰 객체를 반환합니다.
 */
export const createPasswordResetToken = async (email: string) => {
  // 기존의 `generatePasswordResetToken` 라이브러리 함수가 DB 작업을 포함하므로 그대로 활용합니다.
  return await issuePasswordResetToken(email);
};
