import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { service } from "~/features/auth/reset/index";
import ResetForm from "~/features/auth/reset/ui/ResetForm";

export const action = async (args: ActionFunctionArgs) => {
  return service.handleResetFormAction(args);
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
