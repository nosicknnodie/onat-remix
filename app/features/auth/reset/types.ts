import type { z } from "zod";
import type { ResetSchema } from "./validators";

/**
 * @purpose 이 파일은 비밀번호 재설정 기능에서 사용되는 주요 데이터 타입을 정의합니다.
 * Zod 스키마로부터 TypeScript 타입을 추론하여, 입력 데이터의 형태를 명확히 합니다.
 * 또한, 서비스 함수가 반환할 결과의 타입을 정의하여 API의 응답 형식을 표준화합니다.
 * 타입을 중앙에서 관리함으로써 코드의 안정성과 예측 가능성을 높입니다.
 */

// ResetSchema로부터 추론된 입력 데이터 타입
export type ResetInput = z.infer<typeof ResetSchema>;

// 비밀번호 재설정 서비스의 실행 결과 타입
export type ResetActionResult = {
  success?: string;
  error?: string;
  values?: ResetInput; // 실패 시 입력값을 다시 돌려주기 위함
};
