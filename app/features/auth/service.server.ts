import bcrypt from "bcryptjs";
import { prisma } from "~/libs/db/db.server";
import { auth } from "~/libs/db/lucia.server";
import { sendVerificationEmail } from "~/libs/mail";
import * as q from "./queries.server";
import { issueVerificationToken } from "./token.service.server";

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
  const session = await auth.createSession(userId, {});
  const sessionCookie = auth.createSessionCookie(session.id);
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

export { findKeyByEmail } from "./queries.server";
