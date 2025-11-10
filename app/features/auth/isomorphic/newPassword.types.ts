import type { User } from "@prisma/client";
import type { z } from "zod";
import type { FieldErrors } from "~/types/action"; // 공통 타입을 가져온다고 가정
import type { NewPasswordSchema } from "./newPassword.schema";

/**
 * @purpose 이 파일은 'new-password' 기능 내부에서만 사용되는 데이터 타입을 정의합니다.
 * 프레임워크나 HTTP 응답 형식에 종속되지 않는 순수한 기능적 타입을 정의하여
 * 서비스 로직의 독립성을 보장합니다.
 */

// 유효성 검사 스키마로부터 추론한 입력 데이터 타입
export type NewPasswordInput = z.infer<typeof NewPasswordSchema>;

// Loader 서비스(토큰 검증)의 결과 타입
export type VerifyTokenResult =
  | {
      token: string;
      user: Pick<User, "email">;
      error?: never;
    }
  | {
      token?: never;
      user?: never;
      error: string;
    };

// Action 서비스(비밀번호 변경)의 결과 타입
export type UpdatePasswordResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: FieldErrors;
    };
