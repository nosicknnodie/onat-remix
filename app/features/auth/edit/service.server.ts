import { redirect } from "@remix-run/node";
import { core, edit } from "~/features/auth/index.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData.server";
import { fail, ok } from "~/utils/action.server";

export async function handleEditUserAction(request: Request) {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const raw = await parseRequestData(request);
  const parsed = edit.validators.parseEditor(raw);
  if (!parsed.ok) {
    return fail("필드 수정이 필요합니다.", parsed.errors.fieldErrors);
  }

  const { name, password } = parsed.data;

  try {
    await core.service.setNameById(user.id, name);
    if (password) {
      await core.service.setPasswordByEmail(user.email, password);
    }
    return ok("회원정보가 수정되었습니다.");
  } catch (err) {
    console.error(err);
    return fail("수정 중 오류가 발생했습니다.");
  }
}
