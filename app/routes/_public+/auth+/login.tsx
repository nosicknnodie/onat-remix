import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useActionData, useNavigation } from "@remix-run/react";
import { Separator } from "~/components/ui/separator";
import { login } from "~/features/auth/index.server";
import LoginForm from "~/features/auth/login/ui/LoginForm";
import { useActionToast } from "~/hooks";

export const action = async ({ request }: ActionFunctionArgs) => {
  return login.service.handleLogin(request);
};

const Login = () => {
  const actions = useActionData<typeof action>();
  useActionToast(actions);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <LoginForm
        values={actions?.values}
        errors={actions?.errors}
        success={actions?.success}
        isSubmitting={isSubmitting}
      />
      <div className="flex justify-end items-center gap-2 text-sm h-4">
        <Link to={"/auth/reset-form"}>비밀번호찾기</Link>
        <Separator orientation="vertical" />
        <Link to={"/auth/register"}>회원가입</Link>
      </div>
    </div>
  );
};

export default Login;
