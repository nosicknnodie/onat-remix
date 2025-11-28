import type { File, User } from "@prisma/client";
import { redirect } from "@remix-run/node";
import _ from "lodash";
import { Lucia, type Session as LuciaSession } from "lucia";
import { adapter } from "./adapter";

// These are passed back on the user during the authentication process.
// Useful to avoid additional DB queries.
// Lucia 인증 인스턴스를 생성합니다
// Prisma 어댑터를 사용하여 데이터베이스와 연동합니다
export const lucia = new Lucia(adapter, {
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
    return {
      ..._.omit(attributes, "password"),
    };
  },
});

// 요청에서 세션을 가져오는 함수
// 쿠키에서 세션 ID를 추출하여 유효성을 검사합니다
export const getSession = async (request: Request): Promise<LuciaSession | null> => {
  const sessionId = request.headers.get("Cookie")?.match(/auth_session=([^;]+)/)?.[1];
  if (!sessionId) return null;
  const { session } = await lucia.validateSession(sessionId);
  return session;
};

// 요청에서 사용자을 가져오는 함수
// 쿠키에서 세션 ID를 추출하여 유효성을 검사합니다
export const getUser = async (request: Request) => {
  const sessionId = request.headers.get("Cookie")?.match(/auth_session=([^;]+)/)?.[1];
  if (!sessionId) return null;
  const { user } = await lucia.validateSession(sessionId);
  return user;
};

// 인증이 필요한 요청에서 사용하는 함수
// 세션이 없으면 로그인 페이지로 리다이렉트합니다
export const requireAuth = async (request: Request): Promise<LuciaSession> => {
  const session = await getSession(request);
  if (!session) {
    const url = new URL(request.url);
    throw redirect(`/auth/login?redirectTo=${url.pathname}`);
  }
  return session;
};

// 👇 이 아래에 위치해야 함!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: User & { userImage?: File };
  }
}
