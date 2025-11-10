import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { service } from "~/features/communities/server";
import { getUser } from "~/libs/db/lucia.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const method = request.method.toUpperCase();
  if (method === "DELETE") {
    if (!params.id) return Response.json({ success: false }, { status: 400 });
    const result = await service.deletePost(params.id, user.id);
    if (result.ok) return Response.json({ success: true });
    return Response.json({ success: false, errors: result.message }, { status: 500 });
  }
};
