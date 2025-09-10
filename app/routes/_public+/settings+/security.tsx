/** biome-ignore-all lint/correctness/useExhaustiveDependencies: off */
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession } from "~/contexts";
import { service as settingsService } from "~/features/settings/index.server";
import { getUser } from "~/libs/index.server";

interface ISecurityPageProps {}

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getUser(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return Response.json({ error: "비밀번호 확인이 일치하지 않습니다." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ error: "비밀번호는 최소 6자 이상이어야 합니다." }, { status: 400 });
  }
  const result = await settingsService.changePassword(session.email, currentPassword, newPassword);
  if (!result.ok) {
    const status = result.message?.includes("현재 비밀번호") ? 401 : 404;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ success: "비밀번호가 변경 되었습니다." });
};

const SecurityPage = (_props: ISecurityPageProps) => {
  const user = useSession();

  const actionData = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);

  if (!user) return null;

  return (
    <Card className="max-w-xl mx-auto mt-8 w-full">
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4" ref={formRef}>
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input type="text" name="email" defaultValue={user.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input type="password" name="currentPassword" required />
          </div>
          <div>
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input type="password" name="newPassword" required />
          </div>
          <div>
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input type="password" name="confirmPassword" required />
          </div>
          <FormSuccess>{actionData?.success}</FormSuccess>
          <FormError>{actionData?.error}</FormError>
          <Button type="submit" className="w-full">
            변경하기
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SecurityPage;
