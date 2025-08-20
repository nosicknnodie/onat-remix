import bcrypt from "bcryptjs";
import * as queries from "./queries";
import type { NewPasswordInput, UpdatePasswordResult, VerifyTokenResult } from "./types";

/**
 * @purpose 이 파일은 기능의 핵심 비즈니스 로직을 캡슐화합니다.
 * Remix의 request, formData 객체에 직접 접근하지 않고, 순수한 데이터(문자열, 객체 등)를 받아
 * 정해진 비즈니스 흐름을 처리하고 결과를 반환합니다.
 * 이로써 프레임워크에 비종속적인, 테스트하기 쉬운 코드가 됩니다.
 */

/**
 * 비밀번호 재설정 토큰의 유효성을 검증합니다. (Loader 로직)
 */
export const verifyPasswordResetToken = async (
  token: string | null,
): Promise<VerifyTokenResult> => {
  if (!token) {
    return { error: "토큰이 없습니다." };
  }
  const existingToken = await queries.findResetToken(token);
  if (!existingToken) {
    return { error: "유효하지 않은 토큰입니다." };
  }

  if (new Date(existingToken.expires) < new Date()) {
    return { error: "만료된 토큰입니다." };
  }

  const existingUser = await queries.findUserByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "토큰에 연결된 사용자를 찾을 수 없습니다." };
  }

  return { token, user: { email: existingUser.email } };
};

/**
 * 사용자 비밀번호를 새로 업데이트합니다. (Action 로직)
 */
export const updateUserPassword = async (
  input: NewPasswordInput,
): Promise<UpdatePasswordResult> => {
  const existingToken = await queries.findResetToken(input.token);
  if (!existingToken) {
    return { error: "유효하지 않은 토큰입니다." };
  }

  const user = await queries.findUserByEmail(existingToken.email);
  if (!user) {
    return { error: "토큰에 연결된 사용자를 찾을 수 없습니다." };
  }

  // 비밀번호 변경 과정에서 이메일이 인증된 것으로 간주
  if (!user.emailVerified) {
    await queries.verifyUserEmail(user.email);
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  await queries.updateUserPassword(user.email, hashedPassword);

  // 사용 완료된 토큰 삭제
  await queries.deleteConfirmToken(existingToken.id);

  return { success: "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요." };
};
