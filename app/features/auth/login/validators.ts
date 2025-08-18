import { loginSchema } from "./schema";

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
