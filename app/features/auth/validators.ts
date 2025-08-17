import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});

export async function parseLoginForm(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return {
      ok: false as const,
      data: null,
      errors: result.error.flatten().fieldErrors,
    };
  }
  return { ok: true as const, data: result.data };
}
