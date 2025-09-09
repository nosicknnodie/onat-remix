import { editorSchema } from "./schema";

// 회원정보 수정 validation
export function parseEditor(data: unknown) {
  const result = editorSchema.safeParse(data);
  if (!result.success) return { ok: false as const, data: null, errors: result.error.flatten() };
  return { ok: true as const, data: result.data };
}
