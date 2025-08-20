import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { service, validators } from "~/features/auth/reset/index";
import ResetForm from "~/features/auth/reset/ui/ResetForm";

/**
 * @purpose 이 파일은 Remix 라우트로서, HTTP 레이어의 역할을 담당합니다.
 * 사용자의 요청(request)을 받아 비즈니스 로직(service)에 전달하고, 그 결과를 UI 컴포넌트에 렌더링하는 '접착제' 역할을 합니다.
 * Remix의 훅(useActionData, useNavigation)과 컴포넌트(Form, Link)는 오직 이 파일에서만 사용됩니다.
 * 이렇게 함으로써 프레임워크와 비즈니스 로직/UI를 명확히 분리합니다.
 */

// 서버 측 로직: 폼 제출을 처리
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  // 1. Validator를 사용한 유효성 검사
  const result = validators.ResetSchema.safeParse({ email });
  if (!result.success) {
    // Zod 에러 메시지를 직접 사용
    const errorMessage = result.error.errors[0]?.message ?? "유효하지 않은 입력입니다.";
    return { error: errorMessage, values: { email: String(email) } };
  }

  // 2. URL 정보 추출하여 Service에 전달
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // 3. 핵심 비즈니스 로직은 Service 함수에 위임
  return await service.requestPasswordReset({ input: result.data, baseUrl });
};

// 클라이언트 측 UI 렌더링
export default function ResetPasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <ResetForm
        actionData={actionData}
        isSubmitting={isSubmitting}
        loginLink={<Link to="/auth/login">로그인</Link>}
        registerLink={<Link to="/auth/register">회원가입</Link>}
      />
    </Form>
  );
}
