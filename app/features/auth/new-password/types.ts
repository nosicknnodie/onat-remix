import type { User } from "@prisma/client";
import type { z } from "zod";
import type { NewPasswordSchema } from "./validators";

/**
 * @purpose 이 파일은 새 비밀번호 설정 기능에서 사용되는 모든 데이터 타입을 정의합니다.
 * Zod 스키마로부터 타입을 추론하고, loader와 action 서비스의 반환 타입을 명시적으로 정의합니다.
 * 타입을 한 곳에서 관리하면 데이터 구조의 일관성을 유지하고 코드 자동 완성을 통해 개발 경험을 향상시킬 수 있습니다.
 */

// 유효성 검사 스키마로부터 추론한 입력 데이터 타입
export type NewPasswordInput = z.infer<typeof NewPasswordSchema>;

// Loader 서비스(토큰 검증)의 결과 타입
export type VerifyTokenResult =
  | {
      token: string;
      user: Pick<User, "email">; // UI에 필요한 최소한의 유저 정보만 포함
      error?: never; // 성공 시 error는 존재하지 않음
    }
  | {
      token?: never;
      user?: never;
      error: string; // 실패 시 에러 메시지만 포함
    };

// Action 서비스(비밀번호 변경)의 결과 타입
export type UpdatePasswordResult = {
  success?: string;
  error?: string;
  // Zod의 flatten된 에러 타입과 호환되도록 정의
  errors?: {
    password?: string[];
    token?: string[];
  };
};
