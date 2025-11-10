import { postSchema } from "./schema";

export function parseNewPost(data: unknown) {
  const result = postSchema.safeParse(data);
  if (!result.success) return { ok: false as const, errors: result.error.flatten(), values: data };
  return { ok: true as const, data: result.data };
}
