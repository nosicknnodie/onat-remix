import { redirect } from "@remix-run/node";
import { getUser, prisma } from "~/libs/index.server";

export async function getEditUserLoader(request: Request) {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return { user: dbUser };
}
