import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";

const schema = z.object({
  name: z.string().min(1),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "비밀번호는 6자 이상이어야 합니다.",
    }),
  phone: z.string().nullable().optional(),
  birthDay: z.string().nullable().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return Response.json({ user: dbUser });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return Response.json({ errorMessage: "로그인이 필요합니다." }, { status: 401 });

  const formData = await request.formData();
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return Response.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, password } = result.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
      },
    });

    if (password) {
      await prisma.key.update({
        where: { id: `email:${user.email}` },
        data: { hashedPassword: await bcrypt.hash(password, 10) },
      });
    }

    return Response.json({ success: "회원정보가 수정되었습니다." });
  } catch (err) {
    console.error(err);
    return Response.json({ errorMessage: "수정 중 오류가 발생했습니다." });
  }
};

const EditProfile = () => {
  const { user } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-md mx-auto mt-6 space-y-4">
      <h1 className="text-xl font-bold text-center">회원정보 수정</h1>
      <Form method="post" className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input name="email" defaultValue={user.email} disabled />
        </div>
        <div>
          <Label htmlFor="name">
            이름<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input name="name" defaultValue={user.name ?? ""} required />
          <FormError>{data?.errors?.name}</FormError>
        </div>
        <div>
          <Label htmlFor="password">비밀번호 변경</Label>
          <Input name="password" type="password" placeholder="••••••••" />
          <p className="text-sm text-muted-foreground">입력 시 비밀번호가 변경됩니다</p>
        </div>
        <FormSuccess>{data?.success}</FormSuccess>
        <FormError>{data?.errorMessage}</FormError>
        <Button type="submit" className="w-full">
          정보 수정
        </Button>
      </Form>
    </div>
  );
};

export default EditProfile;
