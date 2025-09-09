import { redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import _ from "lodash";
import { prisma } from "~/libs/db/db.server";
import { lucia } from "~/libs/db/lucia.server";
import { sendVerificationEmail } from "~/libs/mail.server";
import { parseRequestData } from "~/libs/requestData.server";
import { findKeyByEmail } from "../core/queries.server";
import { issueVerificationToken } from "../core/token.service.server";
import { parseLogin } from "./validators";

export async function handleLogin(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // 1) 파싱 & 유효성 검사
  const raw = await parseRequestData(request);
  const parsed = parseLogin(raw);
  if (!parsed.ok) {
    return Response.json({ errors: parsed.errors }, { status: 401, statusText: "Bad Request" });
  }

  try {
    // 2) 사용자 키 조회
    const key = await findKeyByEmail(parsed.data.email);
    if (!key) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: _.omit(parsed.data, "password"),
        },
        { status: 401 },
      );
    }

    // 3) 비밀번호 검증
    const isValid = await verifyPassword(parsed.data.password, key.hashedPassword);
    if (!isValid) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: _.omit(parsed.data, "password"),
        },
        { status: 401 },
      );
    }

    // 4) 이메일 인증 필요 시 처리
    const user = key.user;
    const check = await ensureVerifiedEmail(
      { email: user.email, emailVerified: user.emailVerified },
      baseUrl,
    );
    if (check.needsVerification) return check.response;

    // 5) 세션 생성 + 만료 세션 정리
    const { sessionCookie } = await createSessionAndCleanup(key.userId, user?.id);

    // 6) 홈으로 redirect
    return redirect("/", {
      headers: { "Set-Cookie": sessionCookie.serialize() },
    });
  } catch (_error) {
    console.error(_error);
    return Response.json(
      {
        errors: { password: "오류입니다." },
        values: parsed.ok ? _.omit(parsed.data, "password") : undefined,
      },
      { status: 401 },
    );
  }
}

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
