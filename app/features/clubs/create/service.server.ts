import type { User } from "@prisma/client";
import { prisma } from "~/libs/db/db.server";
import type { CreateClubInput } from "./validators";

export async function createClub({
  input,
  ownerUser,
}: {
  input: CreateClubInput;
  ownerUser: Omit<User, "password">;
}) {
  const { name, description, isPublic, imageId, emblemId, si, gun } = input;

  const club = await prisma.$transaction(async (tx) => {
    const txClub = await tx.club.create({
      data: {
        name,
        description,
        isPublic,
        imageId: imageId || undefined,
        emblemId: emblemId || undefined,
        si: si || null,
        gun: gun || null,
        ownerUserId: ownerUser.id,
        createUserId: ownerUser.id,
        boards: {
          createMany: {
            data: [
              { name: "공지사항", slug: "notice", order: 0, type: "NOTICE" },
              { name: "자유게시판", slug: "free", order: 10, type: "TEXT" },
              { name: "갤러리", slug: "gallery", order: 20, type: "GALLERY" },
              { name: "자료실", slug: "archive", order: 30, type: "ARCHIVE" },
            ],
          },
        },
      },
    });

    await tx.player.create({
      data: {
        userId: ownerUser.id,
        clubId: txClub.id,
        nick: ownerUser.name || "Unknown",
        role: "MASTER",
      },
    });

    return txClub;
  });

  return club;
}
