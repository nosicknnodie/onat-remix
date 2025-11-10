import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useActionData, useLoaderData } from "@remix-run/react";
import { EditorForm } from "~/features/auth/client";
import { editService } from "~/features/auth/server";
import { getUser } from "~/libs/index.server";
import type { ActionData } from "~/types/action";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const dbUser = await editService.getEditUser(user.id);
  return { user: dbUser };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await editService.handleEditUserAction(request);
  // Pass through redirects or native Responses
  if (result instanceof Response) return result;
  // Normalize to Response with 422 for validation failures
  const data = result as ActionData;
  const status = data.ok ? 200 : data.fieldErrors ? 422 : 400;
  return Response.json(data, { status });
};

const EditProfile = () => {
  const { user } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  if (!user) return null;
  return (
    <div className="max-w-md mx-auto mt-6 space-y-4">
      <h1 className="text-xl font-bold text-center">회원정보 수정</h1>
      <EditorForm values={user} errors={data?.fieldErrors} ok={data?.ok} message={data?.message} />
    </div>
  );
};

export default EditProfile;
