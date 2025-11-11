import type { LoaderFunctionArgs } from "@remix-run/node";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { service } from "~/features/communities/server";
import { getUser } from "~/libs/db/lucia.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const postId = params.postId ?? params.id;
  if (!postId) {
    return Response.json({ ok: false, message: "Post ID is required" }, { status: 400 });
  }

  try {
    const result = await service.getPostDetail(postId, user?.id);
    if (!result) {
      return Response.json({ ok: false, message: "Post not found" }, { status: 404 });
    }
    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
};

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
