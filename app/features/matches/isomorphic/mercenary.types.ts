import { z } from "zod";
import type { mercenaryService } from "~/features/matches/server";

export type Mercenary = Awaited<ReturnType<typeof mercenaryService.getMercenaries>>["mercenaries"];
export type MercenaryItem = Mercenary[number];

export type MercenaryQueryData = {
  mercenaries: MercenaryItem[];
};

export type MercenaryQueryResponse = MercenaryQueryData;

export const mercenaryFormSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수입니다."),
  description: z
    .preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().optional())
    .nullable(),
  hp: z
    .preprocess((v) => {
      if (typeof v !== "string") return v;
      const trimmed = v.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }, z.string().optional())
    .nullable(),
  positions: z.array(z.string()).max(3).default([]),
  userId: z
    .preprocess((v) => {
      if (typeof v !== "string") return v;
      const trimmed = v.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }, z.string().optional())
    .nullable(),
});

export type MercenaryFormValues = z.infer<typeof mercenaryFormSchema>;

export type MercenaryMutationResult =
  | { ok: true; mercenary: MercenaryItem }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
