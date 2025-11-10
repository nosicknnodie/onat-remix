// features/reset-password/validator/index.ts

import { z } from "zod";

/**
 * @purpose 이 파일은 비밀번호 재설정 기능의 입력값 유효성 검사를 담당합니다.
 * Zod를 사용하여 이메일 형식이 올바른지 확인하는 스키마를 정의합니다.
 * 이 스키마는 HTTP 레이어에서 사용자 입력을 서비스 로직으로 전달하기 전에 검증하는 데 사용됩니다.
 * 이렇게 유효성 검사 로직을 분리하면, 다른 환경(e.g., API, CLI)에서도 동일한 규칙을 재사용할 수 있습니다.
 */

export const ResetSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 형식이 아닙니다." }),
});
