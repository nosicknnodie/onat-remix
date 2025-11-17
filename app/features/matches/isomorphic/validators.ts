import { createSchema, updateSchema } from "./match.schema";

export function parseCreate(data: unknown) {
  const result = createSchema.safeParse(data);
  if (!result.success) return { ok: false as const, errors: result.error.flatten(), values: data };
  return { ok: true as const, data: result.data };
}

export function parseUpdate(data: unknown) {
  const result = updateSchema.safeParse(data);
  if (!result.success) return { ok: false as const, errors: result.error.flatten(), values: data };
  return { ok: true as const, data: result.data };
}
