import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getVerificationTokenByToken } from "~/libs/auth/token";
import { prisma } from "~/libs/db/db.server";
import { auth } from "~/libs/db/lucia.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return redirect("/");
  }
  // 토큰확인
  const existingToken = await getVerificationTokenByToken(token);
  if (!existingToken) {
    return { error: "토큰이 존재하지 않습니다." };
  }

  // 토큰 만료확인
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "토큰기간이 만료되었습니다." };
  }

  // 해당 user여부 확인
  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return { error: "이메일이 존재하지 않습니다." };
  }

  // 이메일 확인 체크 업데이트
  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  // 토큰 삭제
  await prisma.confirmToken.delete({
    where: { id: existingToken.id },
  });

  // session 생성
  const session = await auth.createSession(existingUser.id, {});
  const sessionCookie = auth.createSessionCookie(session.id);
  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
};
