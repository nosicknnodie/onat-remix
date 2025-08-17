import bcrypt from "bcryptjs";
import { prisma } from "~/libs/db/db.server";
import { lucia } from "~/libs/db/lucia.server";
import { sendVerificationEmail } from "~/libs/mail";
import * as q from "./queries.server";
import { getVerificationTokenByToken, issueVerificationToken } from "./token.service.server";

export async function verifyPassword(plain: string, hashed?: string | null) {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export async function ensureVerifiedEmail(
  user: { email: string; emailVerified: Date | null },
  baseUrl: string,
) {
  if (!user.emailVerified) {
    const { email, token } = await issueVerificationToken(user.email);
    await sendVerificationEmail(email, token, baseUrl);
    return {
      needsVerification: true as const,
      response: Response.json({ success: "확인 이메일을 보냈습니다." }),
    };
  }
  return { needsVerification: false as const };
}

export async function createSessionAndCleanup(userId: string, cleanupUserId?: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  // 만료된 세션 정리(베스트 에포트)
  if (cleanupUserId) {
    await prisma.session.deleteMany({
      where: { userId: cleanupUserId, expiresAt: { lt: new Date() } },
    });
  }
  return { sessionCookie };
}

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
