import type { ActionFunctionArgs } from "@remix-run/node";
import { sendPasswordResetEmail } from "~/libs/mail.server";
import { createPasswordResetToken, findUserByEmail } from "./queries";
import type { ResetActionResult, ResetInput } from "./types";
import { ResetSchema } from "./validators";

export async function handleResetFormAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  // 1. Validator를 사용한 유효성 검사
  const result = ResetSchema.safeParse({ email });
  if (!result.success) {
    // Zod 에러 메시지를 직접 사용
    const errorMessage = result.error.errors[0]?.message ?? "유효하지 않은 입력입니다.";
    return { error: errorMessage, values: { email: String(email) } };
  }

  // 2. URL 정보 추출하여 Service에 전달
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // 3. 핵심 비즈니스 로직은 Service 함수에 위임
  return await requestPasswordReset({ input: result.data, baseUrl });
}

/**
 * @purpose 이 파일은 비밀번호 재설정 요청의 핵심 비즈니스 로직을 수행합니다.
 * HTTP 요청/응답이나 Remix 훅과 같은 프레임워크 종속적인 코드를 전혀 포함하지 않습니다.
 * 대신, query, validator 등의 다른 레이어에서 필요한 함수를 가져와 비즈니스 흐름을 오케스트레이션합니다.
 * 이로 인해 로직의 재사용성이 극대화되고 단위 테스트가 매우 용이해집니다.
 */
type RequestPasswordResetParams = {
  input: ResetInput;
  baseUrl: string; // 이메일에 포함될 링크를 생성하기 위한 기본 URL (e.g., "https://example.com")
};

export const requestPasswordReset = async ({
  input,
  baseUrl,
}: RequestPasswordResetParams): Promise<ResetActionResult> => {
  try {
    // 1. 이메일로 사용자 조회
    const existingUser = await findUserByEmail(input.email);
    if (!existingUser) {
      return { error: "이메일이 존재하지 않습니다.", values: input };
    }

    // 2. 비밀번호 재설정 토큰 발급 (DB 작업은 query 레이어에서 처리)
    const passwordResetToken = await createPasswordResetToken(existingUser.email);

    // 3. 재설정 이메일 발송
    await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token, baseUrl);

    return { success: "이메일을 보냈습니다. 확인 부탁드립니다." };
  } catch (error) {
    // 예상치 못한 에러 처리
    console.error("Password reset service error:", error);
    return { error: "요청 처리 중 오류가 발생했습니다.", values: input };
  }
};
