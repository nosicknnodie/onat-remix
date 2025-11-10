import { loginSchema } from "./login.schema";

export function parseLogin(data: unknown) {
  const result = loginSchema.safeParse(data);
  if (!result.success)
    return { ok: false as const, data: null, errors: result.error.flatten().fieldErrors };
  return { ok: true as const, data: result.data };
}
