import { BoardType, UserRoleType } from "@prisma/client";
import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1, "slug is required"),
  type: z.nativeEnum(BoardType),
  order: z.string().min(1, "order is required"),
  readRole: z.union([z.nativeEnum(UserRoleType), z.literal("ALL")]),
  writeRole: z.union([z.nativeEnum(UserRoleType), z.literal("ALL")]),
});

const toNullableRole = (role: string | null): UserRoleType | null => {
  if (role === "ALL") return null;
  return role as UserRoleType;
};

export function parseCreateBoard(data: unknown) {
  const result = createBoardSchema.safeParse(data);
  if (!result.success) return { ok: false as const, errors: result.error.flatten() };
  const dto = {
    name: result.data.name,
    slug: result.data.slug,
    type: result.data.type,
    order: Number(result.data.order),
    readRole: toNullableRole(result.data.readRole),
    writeRole: toNullableRole(result.data.writeRole),
  };
  return { ok: true as const, data: dto };
}
