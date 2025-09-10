import { AttendanceState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import * as z from "zod";
import { getUser, prisma } from "~/libs/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return { error: "Unauthorized" };
  const url = new URL(request.url);
  const matchClubId = url.searchParams.get("matchClubId");
  if (!matchClubId) return { error: "Unauthorized" };

  const attendances = await prisma.attendance.findMany({
    where: {
      matchClubId,
      isVote: true,
    },
    include: {
      team: true,
      assigneds: true,
      player: { include: { user: { include: { userImage: true } } } },
      mercenary: { include: { user: { include: { userImage: true } } } },
    },
  });
  return Response.json({ success: "success", attendances });
};

const AttendanceValidate = z.object({
  id: z.string(),
  isVote: z.boolean().optional(),
  isCheck: z.boolean().optional(),
  state: z.nativeEnum(AttendanceState).optional(),
});

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return { error: "Unauthorized" };
  const raw = await request.json();
  const result = AttendanceValidate.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  const { id, ...data } = result.data;
  const checkTime = data.isCheck ? new Date() : null;
  try {
    await prisma.attendance.update({
      data: { ...data, checkTime },
      where: {
        id,
      },
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
