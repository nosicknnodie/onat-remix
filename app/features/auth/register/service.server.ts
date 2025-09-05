// features/register/service.ts

import bcrypt from "bcryptjs";
import { generateVerificationToken } from "~/libs/auth/token";
import { prisma } from "~/libs/db/db.server";
import { sendVerificationEmail } from "~/libs/mail";
import { registerSchema } from "./schema";
import type { RegisterFormData } from "./types";

export async function handleRegister(request: Request) {
  const formData = await request.formData();
  const url = new URL(request.url);
  const host = url.host;
  const protocol = url.protocol;
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors, values: result.data },
      { status: 400 },
    );
  }

  const serviceResult = await registerUserService(result.data, host, protocol);

  // 서비스 레이어의 결과를 기반으로 HTTP 응답을 생성합니다.
  if (serviceResult.errors) {
    return Response.json({ errors: serviceResult.errors, values: result.data }, { status: 400 });
  }

  if (serviceResult.errorMessage) {
    return Response.json({ errorMessage: serviceResult.errorMessage }, { status: 500 });
  }

  return Response.json({ success: serviceResult.success });
}

/**
 * 회원가입의 모든 비즈니스 로직을 처리하는 서비스 함수입니다.
 *
 * @param data - 유효성 검사를 통과한 회원가입 폼 데이터.
 * @param host - 이메일 전송에 사용될 호스트 정보.
 * @param protocol - 이메일 전송에 사용될 프로토콜 정보.
 * @returns 성공 또는 실패 메시지를 포함하는 객체.
 */
export async function registerUserService(data: RegisterFormData, host: string, protocol: string) {
  try {
    // 1. 이미 가입된 이메일인지 확인합니다.
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return { errors: { email: ["이미 가입된 이메일입니다."] } };
    }

    // 2. 비밀번호를 암호화합니다.
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. 사용자 및 비밀번호 키를 생성합니다.
    // 이는 데이터베이스와 관련된 모든 로직을 캡슐화합니다.
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
      },
    });

    await prisma.key.create({
      data: {
        id: `email:${data.email}`,
        userId: user.id,
        hashedPassword,
      },
    });

    // 4. 이메일 확인 토큰을 생성하고 전송합니다.
    const verificationToken = await generateVerificationToken(data.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
      `${protocol}//${host}`,
    );

    return { success: "확인 메일을 보냈습니다." };
  } catch (error) {
    console.error("회원가입 서비스 오류:", error);
    return { errorMessage: "오류입니다." };
  }
}
