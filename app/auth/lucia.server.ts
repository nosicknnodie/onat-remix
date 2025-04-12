import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { redirect } from "@remix-run/node";
import { Lucia, type Session } from "lucia";
import { key, session } from "~/auth/db.server";
import type { IUserAttributes } from "~/types/auth";

// Lucia 인증 인스턴스를 생성합니다
// Prisma 어댑터를 사용하여 데이터베이스와 연동합니다
export const auth = new Lucia(new PrismaAdapter(session, key), {
  // 세션 쿠키 설정
  // 프로덕션 환경에서는 secure 속성을 true로 설정합니다
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  // 사용자 속성을 반환하는 함수
  // 데이터베이스에서 가져온 사용자 정보를 필요한 형태로 변환합니다
  getUserAttributes: (attributes) => {
    const { email, name } = attributes as IUserAttributes;
    return {
      email,
      name,
    };
  },
});

// 요청에서 세션을 가져오는 함수
// 쿠키에서 세션 ID를 추출하여 유효성을 검사합니다
export const getSession = async (request: Request): Promise<Session | null> => {
  const sessionId = request.headers.get("Cookie")?.match(/auth_session=([^;]+)/)?.[1];
  if (!sessionId) return null;
  const { session } = await auth.validateSession(sessionId);
  return session;
};

// 인증이 필요한 요청에서 사용하는 함수
// 세션이 없으면 로그인 페이지로 리다이렉트합니다
export const requireAuth = async (request: Request): Promise<Session> => {
  const session = await getSession(request);
  if (!session) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${url.pathname}`);
  }
  return session;
};
