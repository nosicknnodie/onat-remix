import { z } from "zod";
import { parseRequestData } from "~/libs/requestData";

export const createSchema = z.object({
  clubId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  hour: z.string().min(1),
  minute: z.string().min(1),
  placeName: z.string().optional(),
  address: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  isSelf: z.union([z.literal("on"), z.undefined()]),
});

export const updateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  hour: z.string().min(1),
  minute: z.string().min(1),
  placeName: z.string().optional(),
  address: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export async function parseCreateForm(request: Request) {
  const raw = await parseRequestData(request);
  const result = createSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false as const,
      errors: result.error.flatten(),
      values: raw,
    };
  }
  return { ok: true as const, data: result.data };
}

export async function parseUpdateForm(request: Request) {
  const raw = await parseRequestData(request);
  const result = updateSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false as const,
      errors: result.error.flatten(),
      values: raw,
    };
  }
  return { ok: true as const, data: result.data };
}
