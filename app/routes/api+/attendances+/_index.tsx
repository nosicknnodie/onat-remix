import { LoaderFunctionArgs } from "@remix-run/node";
import z from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return { error: "Unauthorized" };
  const url = new URL(request.url);
  const matchClubId = url.searchParams.get("matchClubId");
  if (!matchClubId) return { error: "Unauthorized" };

  const attendances = await prisma.attendance.findMany({
    where: {
      matchClubId,
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
  try {
    await prisma.attendance.update({
      data: data,
      where: {
        id,
      },
    });
    return Response.json({ success: "success" });
  } catch {
    return Response.json({ error: "Internal Server Error" });
  }
};
