import bcrypt from "bcryptjs";
import { prisma } from "~/libs/db/db.server";
import { lucia } from "~/libs/db/lucia.server";
import { sendVerificationEmail } from "~/libs/mail";
import { findKeyByEmail } from "../core/queries.server";
import { issueVerificationToken } from "../core/token.service.server";

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

export { findKeyByEmail };
