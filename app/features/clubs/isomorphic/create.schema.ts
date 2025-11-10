import { z } from "zod";

export const CreateClubSchema = z.object({
  name: z.string().min(1, "클럽 이름은 필수입니다."),
  description: z.string().optional(),
  isPublic: z.preprocess((val) => val === "true", z.boolean()),
  si: z.string().optional().nullable(),
  gun: z.string().optional().nullable(),
  imageId: z.string().optional().nullable(),
  emblemId: z.string().optional().nullable(),
});

export type CreateClubInput = z.infer<typeof CreateClubSchema>;
