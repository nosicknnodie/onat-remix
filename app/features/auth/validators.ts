import { z } from "zod";
import { parseRequestData } from "~/libs/requestData";

export const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});

export const editorSchema = z.object({
  name: z.string().min(1),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "비밀번호는 6자 이상이어야 합니다.",
    }),
  phone: z.string().nullable().optional(),
  birthDay: z.string().nullable().optional(),
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

// 회원정보 수정 validation
export async function parseEditorForm(request: Request) {
  const data = await parseRequestData(request);
  const result = editorSchema.safeParse(data);
  if (!result.success) {
    return {
      ok: false as const,
      data: null,
      errors: result.error.flatten(),
    };
  }
  return { ok: true as const, data: result.data };
}
