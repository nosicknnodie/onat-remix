import { TokenType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";

const NewPasswordSchema = z.object({
  password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null,
) => {
  if (!token) {
    return { error: "토큰이 없습니다." };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "필드 입력값이 맞지 않습니다." };
  }

  const { password } = validatedFields.data;

  const existingToken = await prisma.confirmToken.findUnique({
    where: { token, type: TokenType.PASSWORD_RESET },
  });

  if (!existingToken) {
    return { error: "토큰이 맞지 않습니다." };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "토큰이 만료가 되었습니다." };
  }
  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return { error: "이메일이 존재하지 않습니다." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.key.update({
    where: { id: `email:${existingUser.email}` },

    data: { hashedPassword },
  });

  await prisma.confirmToken.delete({
    where: { id: existingToken.id },
  });

  return { success: "비밀번호를 성공적으로 업데이트 했습니다." };
};
