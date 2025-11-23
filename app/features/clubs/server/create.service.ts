import type { User } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getUser, prisma } from "~/libs/index.server";
import { type CreateClubInput, CreateClubSchema } from "../isomorphic";
import { sanitizeDiscordWebhook } from "./utils";

export async function handleCreateClubAction({ request }: ActionFunctionArgs): Promise<Response> {
  const user = await getUser(request);
  if (!user) {
    return redirect("/auth/login");
  }
  if (!user.name) {
    return redirect("/settings/edit");
  }

  const formData = await request.formData();
  const result = CreateClubSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return Response.json(
      { ok: false, fieldErrors: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const club = await createClub({ input: result.data, ownerUser: user });
    return redirect(`/clubs/${club.id}`);
  } catch (err) {
    console.error(err);
    return Response.json(
      { ok: false, message: "클럽 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function createClub({
  input,
  ownerUser,
}: {
  input: CreateClubInput;
  ownerUser: Omit<User, "password">;
}) {
  const { name, description, isPublic, imageId, emblemId, si, gun, discordWebhook } = input;

  const sanitizedWebhook = sanitizeDiscordWebhook(discordWebhook);
  if (discordWebhook && !sanitizedWebhook) {
    throw new Error("유효한 Discord Webhook URL이 아닙니다.");
  }

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
        discordWebhook: sanitizedWebhook,
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
        status: "APPROVED",
      },
    });

    return txClub;
  });

  return club;
}
