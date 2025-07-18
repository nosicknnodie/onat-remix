import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const method = request.method.toUpperCase();
  if (method === "DELETE") {
    try {
      await prisma.post.update({
        where: {
          id: params.id,
          authorId: user.id,
        },
        data: {
          state: "DELETED",
        },
      });
      return Response.json({ success: "success" });
    } catch (error) {
      console.error(error);
      return Response.json(
        { success: false, errors: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
};
