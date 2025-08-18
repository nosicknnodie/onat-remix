// ui/RegisterForm.tsx

import { Form, Link } from "@remix-run/react";
import { AiOutlineUserAdd } from "react-icons/ai";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

interface RegisterFormProps {
  data?: {
    errors?: {
      name?: string[];
      email?: string[];
      password?: string[];
    };
    values?: {
      email?: string;
    };
    success?: string;
    errorMessage?: string;
  };
  isSubmitting: boolean;
}

/**
 * 회원가입 폼의 순수 UI 컴포넌트입니다.
 * Remix의 훅을 사용하지 않고, 모든 데이터를 props로 받아 렌더링합니다.
 * 이를 통해 UI와 비즈니스/HTTP 로직이 분리됩니다.
 *
 * @param props - 폼 데이터, 에러, 성공 메시지, 제출 상태를 포함한 객체.
 */
export function RegisterForm({ data, isSubmitting }: RegisterFormProps) {
  const success = data?.success;
  const errorMessage = data?.errorMessage;

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
          <Input type="text" name="name" required placeholder="홍길동" />
        </div>
        <FormError>{data?.errors?.name}</FormError>
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="email"
            name="email"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="you@example.com"
            defaultValue={data?.values?.email ?? ""}
          />
        </div>
        <FormError>{data?.errors?.email}</FormError>

        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        <FormError>{data?.errors?.password}</FormError>
        <div className="">
          <FormSuccess>{success && success}</FormSuccess>
          <FormError>{errorMessage && errorMessage}</FormError>
        </div>
        <Button type="submit" className="w-full font-semibold">
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
}
