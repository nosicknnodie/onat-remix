// routes/auth.register.tsx (이전 Register.tsx 파일)

import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { register } from "~/features/auth";
import { registerSchema } from "~/features/auth/register/schema";
import { RegisterForm } from "~/features/auth/register/ui/RegisterForm";

/**
 * Remix의 액션 함수로, HTTP 요청을 처리하는 레이어입니다.
 * 폼 데이터를 받아 유효성 검사 후, 비즈니스 로직을 담당하는 서비스 레이어를 호출합니다.
 * 여기서는 데이터베이스 접근이나 기타 복잡한 로직을 직접 수행하지 않습니다.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
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

  const serviceResult = await register.service.registerUserService(result.data, host, protocol);

  // 서비스 레이어의 결과를 기반으로 HTTP 응답을 생성합니다.
  if (serviceResult.errors) {
    return Response.json({ errors: serviceResult.errors, values: result.data }, { status: 400 });
  }

  if (serviceResult.errorMessage) {
    return Response.json({ errorMessage: serviceResult.errorMessage }, { status: 500 });
  }

  return Response.json({ success: serviceResult.success });
};

/**
 * Remix 라우트 컴포넌트로, UI와 HTTP 레이어를 연결하는 역할을 합니다.
 * Remix 훅을 사용해 액션 데이터를 가져오고, UI 컴포넌트에 필요한 props를 전달합니다.
 */
const Register = () => {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  return <RegisterForm data={actionData} isSubmitting={isSubmitting} />;
};

export default Register;
