import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import EditorForm from "~/features/auth/edit/ui/EditorForm";
import { edit } from "~/features/auth/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return edit.queries.getEditUserLoader(request);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return edit.service.handleEditUserAction(request);
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
