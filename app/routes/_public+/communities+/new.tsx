//
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useSession } from "~/contexts";
import { validators } from "~/features/communities/index";
import { service } from "~/features/communities/index.server";
import NewPostForm from "~/features/communities/ui/NewPostForm";
import { getUser } from "~/libs/index.server";

export const handle = { breadcrumb: "새글 쓰기" };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  try {
    return await service.getNewPostData(user.id);
  } catch (error) {
    console.error(error);
    return redirect("../");
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const raw = await (await import("~/libs/requestData.server")).parseRequestData(request);
  const parsed = validators.parseNewPost(raw);
  if (!parsed.ok) {
    return Response.json(
      { success: false, errors: parsed.errors, values: parsed.values },
      { status: 400 },
    );
  }
  // content JSON은 라우트에서 파싱하여 서비스로 DTO 전달
  let contentJSON: unknown;
  try {
    contentJSON = JSON.parse(parsed.data.content);
  } catch {
    return Response.json(
      { success: false, errors: { formErrors: ["본문 포맷이 올바르지 않습니다."] } },
      { status: 400 },
    );
  }
  const result = await service.publishPost(
    { id: parsed.data.id, boardId: parsed.data.boardId, title: parsed.data.title, contentJSON },
    user.id,
  );
  if (result.ok) {
    const to = result.boardSlug ? `/communities/${result.boardSlug}/${result.postId}` : "../";
    return redirect(to);
  }
  if (result.reason === "validation") {
    return Response.json(
      { success: false, errors: result.errors, values: result.values },
      { status: 400 },
    );
  }
  if (result.reason === "forbidden") {
    return Response.json({ success: false, error: result.message }, { status: 403 });
  }
  return Response.json({ success: false, error: result.message }, { status: 500 });
};

interface ICommunityNewPageProps {}

const CommunityNewPage = (_props: ICommunityNewPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const user = useSession();
  const post = loaderData.post;
  const boards = loaderData?.boards
    .filter((board) => (board.isUse && board.writeRole === "ADMIN" ? user?.role === "ADMIN" : true))
    .sort((a, b) => {
      if (a.isUse && !b.isUse) return -1;
      if (!a.isUse && b.isUse) return 1;
      if (a.isUse && b.isUse) return a.order - b.order;
      return 0;
    });
  return <NewPostForm post={post} boards={boards} actionErrors={actionData?.errors} />;
};

export default CommunityNewPage;
