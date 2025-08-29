
import { redirect } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export async function getEditUserLoader(request: Request) {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return { user: dbUser };
}
