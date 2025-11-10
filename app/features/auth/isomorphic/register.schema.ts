import { z } from "zod";

// HTTP 입력 → 도메인 입력으로 들어오기 전에 검증/에러형식을 고정합니다.
export const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  email: z.string().email("유효한 이메일을 입력하세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
