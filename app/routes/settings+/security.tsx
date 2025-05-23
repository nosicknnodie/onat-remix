import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { useEffect, useRef } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSession } from "~/contexts/AuthUserContext";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

interface ISecurityPageProps {}

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getUser(request);
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const keyId = `email:${session.email}`;

  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return Response.json(
      { error: "비밀번호 확인이 일치하지 않습니다." },
      { status: 400 }
    );
  }
  if (newPassword.length < 6) {
    return Response.json(
      { error: "비밀번호는 최소 6자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const key = await prisma.key.findUnique({
    where: { id: keyId },
  });

  if (!key || !key.hashedPassword) {
    return Response.json(
      { error: "사용자를 찾을 수 없거나 비밀번호 설정이 되어있지 않습니다." },
      { status: 404 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, key.hashedPassword);
  if (!isValid) {
    return Response.json(
      { error: "현재 비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.key.update({
    where: { id: keyId },
    data: { hashedPassword: newHashedPassword },
  });

  return Response.json({ success: "비밀번호가 변경 되었습니다." });
};

const SecurityPage = (_props: ISecurityPageProps) => {
  const user = useSession();
  if (!user) return null;
  const actionData = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);

  return (
    <Card className="max-w-xl mx-auto mt-8 w-full">
      <CardHeader>
        <CardTitle>비밀번호 변경</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4" ref={formRef}>
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              type="text"
              name="email"
              id="email"
              defaultValue={user.email ?? ""}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input
              type="password"
              name="currentPassword"
              id="currentPassword"
              required
            />
          </div>
          <div>
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              type="password"
              name="newPassword"
              id="newPassword"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
            />
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
