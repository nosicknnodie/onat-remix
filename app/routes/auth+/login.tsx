import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { LuLogIn } from "react-icons/lu";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { generateVerificationToken } from "~/libs/auth/token";
import { prisma } from "~/libs/db/db.server";
import { auth } from "~/libs/db/lucia.server";
import { sendVerificationEmail } from "~/libs/mail";

const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
  password: z
    .string()
    .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const url = new URL(request.url);
  const host = url.host;
  const protocol = url.protocol;
  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 401, statusText: "Bad Request" }
    );
  }
  try {
    // 비밀번호 값을 조회 (user join)
    const key = await prisma.key.findUnique({
      where: {
        id: `email:${email}`,
      },
      include: {
        user: true,
      },
    });
    // 비밀번호가 없을경우
    if (!key || !key.hashedPassword) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: result.data,
        },
        { status: 401 }
      );
    }
    // 비밀번호가 맞지 않을 경우
    const isValid = await bcrypt.compare(
      result.data.password,
      key.hashedPassword
    );

    if (!isValid) {
      return Response.json(
        {
          errors: { password: "비밀번호가 맞지 않습니다." },
          values: result.data,
        },
        { status: 401 }
      );
    }
    const user = key.user;

    // 이메일 인증 체크가 안되어있는경우 인증메일을 보냄
    if (user && !user?.emailVerified) {
      const verificationToken = await generateVerificationToken(user.email);
      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
        `${protocol}//${host}`
      );
      return Response.json({ success: "확인 이메일을 보냈습니다." });
    }
    // 세션 생성
    const session = await auth.createSession(key.userId, {});
    const sessionCookie = auth.createSessionCookie(session.id);
    // 홈으로 redirect
    return redirect("/", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  } catch (_error) {
    console.error(_error);
    return Response.json(
      { errors: { password: "오류입니다." }, values: result.data },
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
      <Form method="post" className="space-y-6">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <LuLogIn />
          <span>로그인</span>
        </p>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            이메일
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            required
            placeholder="you@example.com"
            defaultValue={actions?.values?.email ?? ""}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호
          </label>
          <Input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        <FormSuccess>{actions?.success}</FormSuccess>
        <FormError>{actions?.errors?.email}</FormError>
        <FormError>{actions?.errors?.password}</FormError>
        <Button
          type="submit"
          className="w-full font-semibold flex justify-center items-center gap-x-2"
          disabled={isSubmitting}
        >
          <span>로그인</span>
          {isSubmitting && <Loading className="text-primary-foreground" />}
        </Button>
      </Form>
      <div className="flex justify-end items-center gap-2 text-sm h-4">
        <Link to={"/auth/reset-form"}>비밀번호찾기</Link>
        <Separator orientation="vertical" />
        <Link to={"/auth/register"}>회원가입</Link>
      </div>
    </div>
  );
};

export default Login;
