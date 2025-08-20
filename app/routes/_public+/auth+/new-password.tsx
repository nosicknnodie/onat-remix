import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { service, validators } from "~/features/auth/new-password/index";
import { NewPasswordForm } from "~/features/auth/new-password/ui/NewPasswordForm";

/**
 * @purpose 이 파일은 Remix 프레임워크와 우리의 feature 로직을 연결하는 '접착제' 역할을 합니다.
 * loader와 action은 HTTP 요청을 받아 service 함수에 필요한 데이터를 전달하고, 그 결과를 클라이언트에 반환합니다.
 * React 컴포넌트는 Remix 훅을 사용하여 데이터를 가져오고, 이 데이터를 순수 UI 컴포넌트의 props로 전달합니다.
 * 프레임워크에 종속적인 모든 코드는 이 파일에만 존재하게 됩니다.
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // 토큰 검증 로직은 service에 위임
  const result = await service.verifyPasswordResetToken(token);
  return result;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // 1. Validator를 사용한 유효성 검사
  const result = validators.NewPasswordSchema.safeParse(data);
  if (!result.success) {
    return Response.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  // 2. 핵심 비즈니스 로직은 Service 함수에 위임
  const actionResult = await service.updateUserPassword(result.data);
  return Response.json(actionResult);
};

export default function NewPasswordPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    // UI 컴포넌트는 Form으로 감싸서 제출 기능을 활성화
    <Form method="post">
      <NewPasswordForm
        loaderData={loaderData}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />
    </Form>
  );
}
