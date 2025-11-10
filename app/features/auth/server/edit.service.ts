import { redirect } from "@remix-run/node";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData.server";
import { fail, ok } from "~/utils/action.server";
import { editValidators } from "../isomorphic";
import { service } from ".";
import * as queries from "./edit.queries";

export async function handleEditUserAction(request: Request) {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");

  const raw = await parseRequestData(request);
  const parsed = editValidators.parseEditor(raw);
  if (!parsed.ok) {
    return fail("필드 수정이 필요합니다.", parsed.errors.fieldErrors);
  }

  const { name, password } = parsed.data;

  try {
    await service.setNameById(user.id, name);
    if (password) {
      await service.setPasswordByEmail(user.email, password);
    }
    return ok("회원정보가 수정되었습니다.");
  } catch (err) {
    console.error(err);
    return fail("수정 중 오류가 발생했습니다.");
  }
}

export async function getEditUser(userId: string) {
  return await queries.getEditUser(userId);
}
