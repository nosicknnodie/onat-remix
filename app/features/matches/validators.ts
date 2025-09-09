import { z } from "zod";

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
