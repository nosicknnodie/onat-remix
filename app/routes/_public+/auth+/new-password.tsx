import { TokenType } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { MdPassword } from "react-icons/md";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { prisma } from "~/libs/db/db.server";

const findPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "토큰이 없습니다." });
  }

  const existingToken = await prisma.confirmToken.findUnique({
    where: { token, type: TokenType.PASSWORD_RESET },
  });

  if (!existingToken) {
    return Response.json({ error: "토큰이 맞지 않습니다." });
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return Response.json({ error: "토큰이 만료가 되었습니다." });
  }
  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return Response.json({ error: "이메일이 존재하지 않습니다." });
  }
  return Response.json({ token, user: existingUser });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const password = formData.get("password");
  const token = formData.get("token");
  const result = findPasswordSchema.safeParse({ password, token });

  if (!result.success) {
    return Response.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }
  const existingToken = await prisma.confirmToken.findUnique({
    where: { token: result.data.token, type: TokenType.PASSWORD_RESET },
  });

  if (!existingToken) {
    return Response.json({ error: "토큰이 맞지 않습니다." });
  }

  // 회원 조회
  const user = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  // 이메일 인증확인이 안되어있으면 비밀번호 발급흐름에 따라 이메일을 확인 한것으로 간주
  if (!user?.emailVerified) {
    await prisma.user.update({
      where: { email: existingToken.email },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10);

  await prisma.key.update({
    where: { id: `email:${existingToken.email}` },
    data: { hashedPassword },
  });

  await prisma.confirmToken.delete({
    where: { id: existingToken?.id },
  });

  return Response.json({ success: "비밀번호 변경에 성공하었습니다." });
};

const NewPassword = () => {
  const loadData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";
  return (
    <>
      <div className="max-w-md w-full space-y-4 mt-6">
        <Form method="post" className="space-y-4">
          <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
            <MdPassword />
            <span>비밀번호 변경</span>
          </p>
          <div>
            <label htmlFor="email">이메일</label>
            <input
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
              defaultValue={loadData.user.email ?? ""}
              disabled
            ></input>
            <input type="hidden" name="token" defaultValue={loadData.token ?? ""}></input>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <FormError>{actionData?.errors?.password}</FormError>
            <FormError>{actionData?.error}</FormError>
            <FormSuccess>{actionData?.success}</FormSuccess>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-black/80 transition font-semibold flex justify-center items-center"
          >
            <span>비밀번호 변경</span>
            {isSubmitting && <Loading className="text-primary-foreground" />}
          </button>
        </Form>
      </div>
    </>
  );
};

export default NewPassword;
