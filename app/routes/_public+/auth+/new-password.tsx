import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { service, validators } from "~/features/auth/new-password/index";
import { NewPasswordForm } from "~/features/auth/new-password/ui/NewPasswordForm";
import type { ActionData } from "~/types/action"; // 공통 타입을 가져온다고 가정

/**
 * @purpose Remix 프레임워크와 feature 로직을 연결하는 'HTTP 레이어'입니다.
 * loader와 action은 HTTP 요청을 받아 service 함수에 전달하고, 그 결과를 표준화된 응답(ActionData)으로
 * 변환하여 클라이언트에 반환하는 책임을 집니다. 프레임워크 종속 코드는 모두 이 파일에 있습니다.
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const result = await service.verifyPasswordResetToken(token);
  return result;
};

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const validationResult = validators.NewPasswordSchema.safeParse(data);
  if (!validationResult.success) {
    const response: ActionData = {
      ok: false,
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
    return Response.json(response, { status: 400 });
  }

  // 핵심 비즈니스 로직은 Service에 위임
  const serviceResult = await service.updateUserPassword(validationResult.data);

  // 서비스 결과를 표준 ActionData 타입으로 변환하여 반환
  if (!serviceResult.success) {
    const response: ActionData = {
      ok: false,
      message: serviceResult.message,
    };
    return Response.json(response, { status: 400 });
  }

  const response: ActionData = {
    ok: true,
    message: serviceResult.message,
  };
  return Response.json(response);
};

export default function NewPasswordPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <NewPasswordForm
        loaderData={loaderData}
        actionData={actionData}
        isSubmitting={isSubmitting}
      />
    </Form>
  );
}
