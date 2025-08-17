import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser, lucia } from "~/libs/db/lucia.server";

// 로그아웃 요청을 처리하는 Remix action 함수
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  // 요청 헤더에서 'auth_session' 쿠키 값을 정규표현식으로 추출
  const sessionId = request.headers.get("Cookie")?.match(/auth_session=([^;]+)/)?.[1];
  // 세션 ID가 존재하는 경우, 해당 세션을 무효화하여 서버 측 세션 상태 종료
  if (sessionId) {
    // 만료된 세션 정리
    await prisma.session.deleteMany({
      where: {
        userId: user?.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    // 로그아웃 세션 삭제
    await lucia.invalidateSession(sessionId);
  }

  // 클라이언트의 'auth_session' 쿠키를 즉시 만료시켜 브라우저에서도 로그아웃 처리
  return redirect("/", {
    headers: {
      // Max-Age=0 을 통해 쿠키를 삭제하고, 보안 강화를 위해 HttpOnly 설정 유지
      "Set-Cookie": "auth_session=; Path=/; HttpOnly; Max-Age=0",
    },
  });
};
