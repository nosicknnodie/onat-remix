import { ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { LuKeyRound } from "react-icons/lu";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { generatePasswordResetToken } from "~/libs/auth/token";
import { prisma } from "~/libs/db/db.server";
import { sendPasswordResetEmail } from "~/libs/mail";

const ResetSchema = z.object({
  email: z.string().email(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const host = url.host;
  const protocol = url.protocol;
  const formData = await request.formData();
  const email = formData.get("email");
  // validation
  const result = ResetSchema.safeParse({ email });
  if (!result.success) {
    return { error: "이메일이 아닙니다.", values: result.data };
  }
  try {
    // find email
    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email },
    });

    if (!existingUser) {
      return { error: "이메일이 존재하지 않습니다.", values: result.data };
    }

    // reset token 발급
    const passwordResetToken = await generatePasswordResetToken(
      existingUser.email
    );
    // 메일 보내기
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token,
      `${protocol}//${host}`
    );
    return { success: "이메일을 보냈습니다. 확인 부탁드립니다." };
  } catch (error) {
    return { error: error ?? "통신 오류입니다.", values: result.data };
  }
};

/**
 * 비밀번호 찾기 폼, 이메일 입력 후 인증 메일 보내기
 * @returns
 */
const ResetForm = () => {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  return (
    <>
      <div className="max-w-md w-full space-y-4 mt-6">
        <Form method="post" className="space-y-3">
          <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
            <LuKeyRound />
            <span>비밀번호 변경</span>
          </p>
          <div className="space-y-1">
            <label htmlFor="email">이메일</label>
            <Input
              id="email"
              name="email"
              defaultValue={actionData?.values?.email ?? ""}
            ></Input>
          </div>
          <div>
            <FormSuccess>{actionData?.success}</FormSuccess>
            <FormError>
              {actionData?.error && JSON.stringify(actionData?.error)}
            </FormError>
          </div>
          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loading className="text-primary-foreground" />}
            <span>인증 메일 발송</span>
          </Button>
        </Form>
        <div className="flex justify-end items-center gap-2 text-sm h-4">
          <Link to={"/auth/login"}>로그인</Link>
          <Separator orientation="vertical"></Separator>
          <Link to={"/auth/register"}>회원가입</Link>
        </div>
      </div>
    </>
  );
};

export default ResetForm;
