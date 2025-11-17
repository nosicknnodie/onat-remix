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
