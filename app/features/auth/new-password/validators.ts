import { z } from "zod";

/**
 * @purpose 이 파일은 새 비밀번호 설정 기능의 입력값 유효성 검사를 전담합니다.
 * Zod를 사용하여 토큰의 존재 여부와 비밀번호의 최소 길이를 검증합니다.
 * 이처럼 유효성 검사 로직을 분리하면, HTTP 레이어뿐만 아니라 다양한 곳에서
 * 동일한 데이터 검증 규칙을 일관되게 적용할 수 있습니다.
 */
export const NewPasswordSchema = z.object({
  token: z.string().min(1, { message: "토큰이 필요합니다." }),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});
