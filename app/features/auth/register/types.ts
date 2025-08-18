import type { z } from "zod";
import type { registerSchema } from "./schema";

/**
 * Zod 스키마로부터 추론된 회원가입 폼 데이터의 타입입니다.
 * 이 타입을 사용하면 폼 데이터와 서비스 함수의 인자가 일관되게 유지됩니다.
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
