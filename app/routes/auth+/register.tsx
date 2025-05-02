import type { ActionFunctionArgs } from "@remix-run/node";
import { data } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { AiOutlineUserAdd } from "react-icons/ai";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { generateVerificationToken } from "~/libs/auth/token";
import { prisma } from "~/libs/db/db.server";
import { sendVerificationEmail } from "~/libs/mail";
interface IRegisterProps {}

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  email: z.string().email("유효한 이메일을 입력하세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  // address: z.string().nullable().nullish(),
  // phone: z.string().nullable().nullish(),
  // birthDay: z.string().nullable().nullish(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const name = formData.get("name");
  // const address = formData.get("address");
  // const phone = formData.get("phone");
  const password = formData.get("password");
  // const birthDay = formData.get("birthDay");
  const url = new URL(request.url);
  const host = url.host;
  const protocol = url.protocol;
  const result = registerSchema.safeParse({
    email,
    password,
    name,
  });
  // TODO: validation
  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors, values: result.data },
      { status: 400 }
    );
  }

  try {
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(result.data.password, 10);

    // 이메일가 가입된 이메일인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: result.data.email },
    });
    // TODO: 가입된 이메일이 있는 경우
    if (existingUser) {
      return Response.json(
        {
          errors: {
            email: ["이미 가입된 이메일입니다."],
          },
        },
        { status: 400 }
      );
    }

    // user 생성
    const user = await prisma.user.create({
      data: {
        email: result.data.email,
        name: result.data.name,
      },
    });
    // 비밀번호 저장
    await prisma.key.create({
      data: {
        id: `email:${result.data.email}`,
        userId: user.id,
        hashedPassword,
      },
    });

    // 토큰 생성
    const verificationToken = await generateVerificationToken(
      result.data.email
    );
    // 토큰 보내기
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
      `${protocol}//${host}`
    );
    return Response.json({ success: "확인 메일을 보냈습니다." });
  } catch (error) {
    console.error(error);
    return Response.json({ errorMessage: "오류입니다." });
  }
};

const Register = (_props: IRegisterProps) => {
  const data = useActionData<typeof action>();
  const success = data?.success;
  const errorMessage = data?.errorMessage;
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <Form method="post" className="space-y-4">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <AiOutlineUserAdd />
          <span>회원가입</span>
        </p>
        <div>
          <Label htmlFor="name">
            이름<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            placeholder="홍길동"
          />
        </div>
        <FormError>{data?.errors?.name}</FormError>
        <div>
          <Label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            이메일<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="you@example.com"
            defaultValue={data?.values?.email ?? ""}
          />
        </div>
        <FormError>{data?.errors?.email}</FormError>

        <div>
          <Label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        <FormError>{data?.errors?.password}</FormError>
        {/* <div>
          <Label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            주소
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="부천시 ..."
          />
        </div>
        <div>
          <Label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            전화번호
          </Label>
          <Input
            type="text"
            id="phone"
            name="phone"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="010-1234-5678"
          />
        </div>
        <div>
          <Label
            htmlFor="birthDay"
            className="block text-sm font-medium text-gray-700"
          >
            생년월일
          </Label>
          <Input
            type="text"
            id="birthDay"
            name="birthDay"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="2000-01-01"
          />
        </div> */}
        <div className="">
          <FormSuccess>{success && success}</FormSuccess>
          <FormError>{errorMessage && errorMessage}</FormError>
        </div>
        <Button type="submit" className="w-full  font-semibold">
          <span>회원가입</span>
          {isSubmitting && <Loading className="text-primary-foreground" />}
        </Button>
      </Form>
      <div className="flex justify-end items-center gap-2 text-sm h-4">
        <Link to={"/auth/login"}>로그인</Link>
        <Separator orientation="vertical"></Separator>
        <Link to={"/auth/reset-form"}>비밀번호찾기</Link>
      </div>
    </div>
  );
};

export default Register;
