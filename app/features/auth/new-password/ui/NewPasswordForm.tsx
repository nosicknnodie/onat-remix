import { Link } from "@remix-run/react";
import { MdPassword } from "react-icons/md";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import type { ActionData } from "~/types/action"; // 공통 타입을 가져온다고 가정
import type { VerifyTokenResult } from "../types";

/**
 * @purpose 새 비밀번호 설정 UI를 렌더링하는 '프레젠테이셔널' 컴포넌트입니다.
 * Remix 훅 대신 props로 받은 loaderData와 표준화된 actionData를 사용하여 UI 상태를 결정합니다.
 * 이로 인해 UI의 예측 가능성이 높아지고, Storybook 등에서 다양한 상태를 쉽게 테스트할 수 있습니다.
 */

type NewPasswordFormProps = {
  loaderData: VerifyTokenResult;
  actionData?: ActionData;
  isSubmitting: boolean;
};

export const NewPasswordForm = ({ loaderData, actionData, isSubmitting }: NewPasswordFormProps) => {
  if (actionData?.ok) {
    return (
      <div className="max-w-md w-full space-y-4 mt-6">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword />
          <span>비밀번호 변경 완료</span>
        </p>
        <FormSuccess>{actionData.message}</FormSuccess>
        <p className="w-full flex justify-center items-center">
          <Button variant={"default"} asChild>
            <Link to="/auth/login">로그인 페이지로 이동</Link>
          </Button>
        </p>
      </div>
    );
  }
  if (loaderData.error) {
    return (
      <div className="max-w-md w-full space-y-4 mt-6">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword /> <span>오류</span>
        </p>
        <FormError>{loaderData.error}</FormError>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <div className="space-y-4">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <MdPassword /> <span>비밀번호 변경</span>
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
          <label htmlFor="password">새 비밀번호</label>
          <input
            type="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md"
            placeholder="••••••••"
          />
        </div>
        <div>
          {/* 표준화된 actionData 타입에 맞춰 UI 렌더링 */}
          {!actionData?.ok && actionData?.message && <FormError>{actionData.message}</FormError>}
          {!actionData?.ok && actionData?.fieldErrors?.password && (
            <FormError>{actionData.fieldErrors.password[0]}</FormError>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white py-2 px-4 rounded font-semibold flex justify-center items-center disabled:bg-gray-400"
        >
          {isSubmitting ? <Loading className="text-white" /> : <span>비밀번호 변경</span>}
        </button>
      </div>
    </div>
  );
};
