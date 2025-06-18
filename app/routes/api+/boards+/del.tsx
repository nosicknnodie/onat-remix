import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";

const boardDeleteSchema = z.object({
  ids: z.array(z.string()),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const data = await parseRequestData(request);
  const result = boardDeleteSchema.safeParse(data);
  if (!result.success) {
    return Response.json(
      { success: false, errors: result.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const res = await prisma.board.updateMany({
      where: {
        id: {
          in: result.data.ids,
        },
      },
      data: {
        slug: null,
        isUse: false,
      },
    });
    if (res.count) {
      return Response.json({ success: "success" });
    }
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, errors: "Internal Server Error" },
      { status: 500 }
    );
  }

  return null;
};
