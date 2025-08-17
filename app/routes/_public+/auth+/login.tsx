import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Link, useActionData, useNavigation } from "@remix-run/react";
import _ from "lodash";
import { Separator } from "~/components/ui/separator";
import { LoginForm } from "~/features/auth";
import { auth } from "~/features/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // 1) 파싱 & 유효성 검사
  const parsed = await auth.validators.parseLoginForm(request);
  if (!parsed.ok) {
    return Response.json(
      { errors: parsed.errors },
      { status: 401, statusText: "Bad Request" }
    );
  }

  try {
    // 2) 사용자 키 조회
    const key = await auth.service.findKeyByEmail(parsed.data.email);
    if (!key) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: _.omit(parsed.data, "password"),
        },
        { status: 401 }
      );
    }

    // 3) 비밀번호 검증
    const isValid = await auth.service.verifyPassword(
      parsed.data.password,
      key.hashedPassword
    );
    if (!isValid) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: _.omit(parsed.data, "password"),
        },
        { status: 401 }
      );
    }

    // 4) 이메일 인증 필요 시 처리
    const user = key.user;
    const check = await auth.service.ensureVerifiedEmail(
      { email: user.email, emailVerified: user.emailVerified },
      baseUrl
    );
    if (check.needsVerification) return check.response;

    // 5) 세션 생성 + 만료 세션 정리
    const { sessionCookie } = await auth.service.createSessionAndCleanup(
      key.userId,
      user?.id
    );

    // 6) 홈으로 redirect
    return redirect("/", {
      headers: { "Set-Cookie": sessionCookie.serialize() },
    });
  } catch (_error) {
    console.error(_error);
    return Response.json(
      {
        errors: { password: "오류입니다." },
        values: parsed.ok ? _.omit(parsed.data, "password") : undefined,
      },
      { status: 401 }
    );
  }
};

const Login = () => {
  const actions = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
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
