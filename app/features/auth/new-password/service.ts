import bcrypt from "bcryptjs";
import * as queries from "./queries";
import type { NewPasswordInput, UpdatePasswordResult, VerifyTokenResult } from "./types";

/**
 * @purpose 기능의 핵심 비즈니스 로직을 캡슐화합니다.
 * Remix의 request/response 객체가 아닌 순수 데이터를 받아 처리하고,
 * 미리 정의된 자체 결과 타입(UpdatePasswordResult)을 반환하여 테스트 용이성과 재사용성을 극대화합니다.
 */

/**
 * Loader 로직: 비밀번호 재설정 토큰의 유효성을 검증합니다.
 */
export const verifyPasswordResetToken = async (
  token: string | null,
): Promise<VerifyTokenResult> => {
  if (!token) return { error: "토큰이 없습니다." };

  const existingToken = await queries.findResetToken(token);
  if (!existingToken) return { error: "유효하지 않은 토큰입니다." };
  if (new Date(existingToken.expires) < new Date()) return { error: "만료된 토큰입니다." };

  const existingUser = await queries.findUserByEmail(existingToken.email);
  if (!existingUser) return { error: "토큰에 연결된 사용자를 찾을 수 없습니다." };

  return { token, user: { email: existingUser.email } };
};

/**
 * Action 로직: 사용자 비밀번호를 새로 업데이트합니다.
 */
export const updateUserPassword = async (
  input: NewPasswordInput,
): Promise<UpdatePasswordResult> => {
  const existingToken = await queries.findResetToken(input.token);
  if (!existingToken) return { success: false, message: "유효하지 않은 토큰입니다." };

  const user = await queries.findUserByEmail(existingToken.email);
  if (!user) return { success: false, message: "토큰에 연결된 사용자를 찾을 수 없습니다." };

  if (!user.emailVerified) await queries.verifyUserEmail(user.email);

  const hashedPassword = await bcrypt.hash(input.password, 10);
  await queries.updateUserPassword(user.email, hashedPassword);
  await queries.deleteConfirmToken(existingToken.id);

  return { success: true, message: "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요." };
};
