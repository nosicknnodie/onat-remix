import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useActionData, useLoaderData } from "@remix-run/react";
import EditorForm from "~/features/auth/ui/EditorForm";
import { auth } from "~/features/index.server";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { fail, ok } from "~/utils/action.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return { user: dbUser };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const parsed = await auth.validators.parseEditorForm(request);
  if (!parsed.ok) {
    return fail("필드 수정이 필요합니다.", parsed.errors.fieldErrors);
  }

  const { name, password } = parsed.data;

  try {
    await auth.service.setNameById(user.id, name);
    if (password) {
      await auth.service.setPasswordByEmail(user.email, password);
    }
    return ok("회원정보가 수정되었습니다.");
  } catch (err) {
    console.error(err);
    return fail("수정 중 오류가 발생했습니다.");
  }
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
