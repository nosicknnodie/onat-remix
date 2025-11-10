import { z } from "zod";

export const editorSchema = z.object({
  name: z.string().min(1),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "비밀번호는 6자 이상이어야 합니다.",
    }),
  phone: z.string().nullable().optional(),
  birthDay: z.string().nullable().optional(),
});

export type IEditorUser = z.infer<typeof editorSchema>;
export type IEditorUserErrors = z.inferFlattenedErrors<typeof editorSchema>;
