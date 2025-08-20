import { Link } from "@remix-run/react";
import { MdPassword } from "react-icons/md";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import type { UpdatePasswordResult, VerifyTokenResult } from "../types";

/**
 * @purpose 이 파일은 새 비밀번호 설정 UI를 렌더링하는 'Dumb' 컴포넌트입니다.
 * Remix 훅을 전혀 사용하지 않으며, 오직 props로 전달된 데이터에 따라 화면을 그립니다.
 * loaderData의 에러 상태에 따라 에러 메시지를 보여주거나 폼을 렌더링합니다.
 * 이처럼 UI를 분리하면 Storybook 등에서 독립적으로 테스트하고 개발하기 매우 편리합니다.
 */

type NewPasswordFormProps = {
  loaderData: VerifyTokenResult;
  actionData?: UpdatePasswordResult;
  isSubmitting: boolean;
};

export const NewPasswordForm = ({ loaderData, actionData, isSubmitting }: NewPasswordFormProps) => {
  if (actionData?.success) {
    return (
      <div className="max-w-md w-full space-y-4 mt-6">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword />
          <span>비밀번호 변경 완료</span>
        </p>
        <FormSuccess>{actionData.success}</FormSuccess>
        <p className="w-full flex justify-center items-center">
          <Button variant={"default"} asChild>
            <Link to="/auth/login">로그인 페이지로 이동</Link>
          </Button>
        </p>
      </div>
    );
  }
  // loader 단계에서 에러가 발생했다면, 폼 대신 에러 메시지를 표시
  if (loaderData.error) {
    return (
      <div className="max-w-md w-full space-y-4 mt-6">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword />
          <span>오류</span>
        </p>
        <FormError>{loaderData.error}</FormError>
      </div>
    );
  }

  // 성공적으로 토큰이 검증된 경우, 비밀번호 변경 폼을 표시
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <div className="space-y-4">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword />
          <span>비밀번호 변경</span>
        </p>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
            defaultValue={loaderData.user?.email ?? ""}
            disabled
          />
          <input type="hidden" name="token" defaultValue={loaderData.token ?? ""} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            새 비밀번호
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
          disabled={isSubmitting}
          className="w-full bg-black text-white py-2 px-4 rounded hover:bg-black/80 transition font-semibold flex justify-center items-center disabled:bg-gray-400"
        >
          {isSubmitting ? <Loading className="text-white" /> : <span>비밀번호 변경</span>}
        </button>
      </div>
    </div>
  );
};
