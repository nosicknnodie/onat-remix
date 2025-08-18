import bcrypt from "bcryptjs";
import { prisma } from "~/libs/db/db.server";
import * as q from "./queries.server";
import { getVerificationTokenByToken } from "./token.service.server";

export async function setNameById(userId: string, name: string) {
  // 권한/검증/이벤트 등 개입 가능 지점
  return q.setNameById(userId, name);
}

export async function setPasswordByEmail(email: string, password: string) {
  // 비밀번호 정책/감사 로그 등
  return q.setHashedPasswordByEmail(email, await bcrypt.hash(password, 10));
}

/**
 * 이메일 검증 토큰을 확인/소모하고, 사용자를 검증 상태로 갱신합니다.
 * 성공 시 userId를 반환합니다.
 */
export async function verifyEmailWithToken(
  token: string,
): Promise<{ ok: true; data: { userId: string } } | { ok: false; message: string }> {
  // 토큰확인
  const existingToken = await getVerificationTokenByToken(token);
  if (!existingToken) return { ok: false, message: "토큰이 존재하지 않습니다." };

  // 토큰 만료확인
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return { ok: false, message: "토큰기간이 만료되었습니다." };

  // 해당 user여부 확인
  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });
  if (!existingUser) return { ok: false, message: "이메일이 존재하지 않습니다." }; // fail("이메일이 존재하지 않습니다.");

  // 이메일 확인 체크 업데이트
  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  // 토큰 삭제(소모)
  await prisma.confirmToken.delete({ where: { id: existingToken.id } });

  return { ok: true, data: { userId: existingUser.id } };
}

export { findKeyByEmail } from "./queries.server";
