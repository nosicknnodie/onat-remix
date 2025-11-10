import type React from "react";
import { LuKeyRound } from "react-icons/lu";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import type { ResetActionResult } from "../isomorphic/reset.types";

/**
 * @purpose 이 파일은 비밀번호 재설정 UI를 담당하는 "프레젠테이셔널(Presentational)" 컴포넌트입니다.
 * Remix의 훅(useNavigation, useActionData 등)을 직접 사용하지 않고, 필요한 모든 데이터를 props로 전달받습니다.
 * 이렇게 UI 로직을 분리하면, UI 컴포넌트의 재사용성이 높아지고 Storybook과 같은 도구에서 독립적으로 개발하고 테스트하기 용이해집니다.
 * 이 컴포넌트는 오직 '어떻게 보일지'에만 집중합니다.
 */

type ResetFormProps = {
  // 서버 액션의 결과 데이터
  actionData?: ResetActionResult;
  // 폼 제출 진행 상태
  isSubmitting: boolean;
  // 외부에서 주입될 로그인 및 회원가입 링크 컴포넌트
  loginLink: React.ReactNode;
  registerLink: React.ReactNode;
};

export const ResetForm = ({
  actionData,
  isSubmitting,
  loginLink,
  registerLink,
}: ResetFormProps) => {
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      {/* 폼 제출은 상위 컴포넌트(라우트)의 <Form> 태그가 담당합니다. */}
      <div className="space-y-3">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <LuKeyRound />
          <span>비밀번호 변경</span>
        </p>
        <div className="space-y-1">
          <label htmlFor="email">이메일</label>
          <Input
            name="email"
            type="email"
            defaultValue={actionData?.values?.email ?? ""}
            required
          />
        </div>
        <div>
          {actionData?.success && <FormSuccess>{actionData.success}</FormSuccess>}
          {actionData?.error && <FormError>{actionData.error}</FormError>}
        </div>
        <Button type="submit" className="w-full font-semibold" disabled={isSubmitting}>
          {isSubmitting && <Loading className="text-primary-foreground" />}
          <span>인증 메일 발송</span>
        </Button>
      </div>

      <div className="flex justify-end items-center gap-2 text-sm h-4">
        {loginLink}
        <Separator orientation="vertical" />
        {registerLink}
      </div>
    </div>
  );
};
