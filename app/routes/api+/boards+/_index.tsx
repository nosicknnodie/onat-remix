import { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const res = await prisma.board.findMany();
  if (res) {
    return Response.json({ boards: res });
  }

  return null;
};
