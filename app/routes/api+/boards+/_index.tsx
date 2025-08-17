import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const data = await parseRequestData(request);
  const clubId = data.clubId;
  // if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // if (user.role !== "ADMIN")
  //   return Response.json({ error: "Forbidden" }, { status: 403 });

  const normalRole = user?.role === "NORMAL" || user?.role === "ADMIN";
  const adminRole = user?.role === "ADMIN";
  try {
    const res = await prisma.board.findMany({
      where: {
        isUse: true,
        clubId: clubId ?? null,
        OR: [
          {
            readRole: null,
          },
          {
            readRole: normalRole ? "NORMAL" : undefined,
          },
          {
            readRole: adminRole ? "ADMIN" : undefined,
          },
        ],
      },
      orderBy: {
        order: "asc",
      },
    });
    return Response.json({ boards: res });
  } catch (error) {
    console.error(error);
  }
  return Response.json({ error: "Internal Server Error" }, { status: 500 });
};
