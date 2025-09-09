import { z } from "zod";

export const postSchema = z.object({
  id: z.string().min(1, "ID 는 필수 입니다."),
  boardId: z.string().min(1, "게시판 선택은 필수 입니다."),
  title: z.string().min(1, "제목은 한글자 이상 필수입니다."),
  content: z.string().min(1, "내용은 한글자 이상 필수입니다."),
});

export type NewPostInput = z.infer<typeof postSchema>;

export function parseNewPost(data: unknown) {
  const result = postSchema.safeParse(data);
  if (!result.success) return { ok: false as const, errors: result.error.flatten(), values: data };
  return { ok: true as const, data: result.data };
}
