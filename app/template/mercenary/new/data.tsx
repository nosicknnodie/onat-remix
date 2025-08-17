import type { PositionType } from "@prisma/client";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { AES } from "~/libs/crypto.utils";
import { prisma } from "~/libs/db/db.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const matchClubId = params.matchClubId;
  if (!matchClubId) return null;

  const formData = await request.formData();
  const actionType = formData.get("actionType")?.toString();
  const email = formData.get("email")?.toString();
  const name = formData.get("name")?.toString();
  const hp = formData.get("hp")?.toString();
  const userId = formData.get("userId")?.toString();
  const description = formData.get("description")?.toString();
  const position1 = formData.get("position1")?.toString() as PositionType | undefined;
  const position2 = formData.get("position2")?.toString() as PositionType | undefined;
  const position3 = formData.get("position3")?.toString() as PositionType | undefined;

  if (actionType === "email") {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        position1: true,
        position2: true,
        position3: true,
      },
    });
    if (!user) return null;

    return { user };
  }
  const matchClub = await prisma.matchClub.findUnique({ where: { id: matchClubId } });
  if (!matchClub) return null;

  if (name) {
    await prisma.mercenary.create({
      data: {
        clubId: matchClub.clubId,
        name,
        description,
        position1: position1 || null,
        position2: position2 || null,
        position3: position3 || null,
        hp: hp ? AES.encrypt(hp) : null,
        userId: userId || null,
      },
    });
  }

  return redirect(`/matches/${matchClub.matchId}/clubs/${matchClubId}/mercenaries`);
};
