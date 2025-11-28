import type { PlayerNativeType, PositionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { invalidateUserSessionCache, prisma } from "~/libs/server";
import { service } from ".";

export async function updateProfile(input: {
  id: string;
  nick?: string;
  name?: string;
  gender?: "MALE" | "FEMALE" | undefined;
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  si?: string | null;
  gun?: string | null;
  userImageId?: string | null;
}) {
  const { id, nick, name, gender, birthYear, birthMonth, birthDay, si, gun, userImageId } = input;
  const MM = birthMonth ? String(birthMonth).padStart(2, "0") : undefined;
  const dd = birthDay ? String(birthDay).padStart(2, "0") : undefined;
  const birthValid = birthYear && MM && dd;
  const birth = birthValid ? `${birthYear}-${MM}-${dd}` : null;

  await prisma.user.update({
    where: { id },
    data: {
      nick,
      name,
      gender,
      birth,
      si: si ?? null,
      gun: gun ?? null,
      userImageId: userImageId ?? null,
    },
  });

  await invalidateUserSessionCache(id);
}

export async function updateBody(
  userId: string,
  input: {
    playerNative: PlayerNativeType | null;
    clothesSize: string | null;
    shoesSize: string | null;
    height: number | null;
  },
) {
  const { playerNative, clothesSize, shoesSize, height } = input;
  await prisma.user.update({
    where: { id: userId },
    data: { playerNative, clothesSize, shoesSize, height },
  });
  await invalidateUserSessionCache(userId);
}

export async function updatePosition(
  userId: string,
  input: {
    position1: PositionType | null;
    position2: PositionType | null;
    position3: PositionType | null;
  },
) {
  const { position1, position2, position3 } = input;
  await prisma.user.update({
    where: { id: userId },
    data: {
      position1: position1 || null,
      position2: position2 || null,
      position3: position3 || null,
    },
  });
  await invalidateUserSessionCache(userId);
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const keyId = `email:${email}`;
  const key = await prisma.key.findUnique({ where: { id: keyId } });
  if (!key || !key.hashedPassword)
    return {
      ok: false as const,
      message: "사용자를 찾을 수 없거나 비밀번호 설정이 되어있지 않습니다.",
    };

  const isValid = await bcrypt.compare(currentPassword, key.hashedPassword);
  if (!isValid) return { ok: false as const, message: "현재 비밀번호가 일치하지 않습니다." };

  await service.setPasswordByEmail(email, newPassword);
  return { ok: true as const };
}
