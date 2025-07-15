import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { AiOutlineUserAdd } from "react-icons/ai";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { prisma } from "~/libs/db/db.server";

const tempSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  address: z.string().nullable().nullish(),
  phone: z.string().nullable().nullish(),
  birthDay: z.string().nullable().nullish(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");

  const result = tempSchema.safeParse({
    name,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: result.data,
    };
  }

  try {
    const tempEmail = `temp-${uuidv4()}@example.com`;

    await prisma.user.create({
      data: {
        name: result.data.name,
        email: tempEmail,
      },
    });

    return { success: "임시 회원이 등록되었습니다." };
  } catch (error) {
    console.error(error);
    return { errorMessage: "등록 중 오류가 발생했습니다." };
  }
};

const TempRegister = () => {
  const data = useActionData<typeof action>();
  const success = data?.success;
  const errorMessage = data?.errorMessage;
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <Form method="post" className="space-y-4">
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <AiOutlineUserAdd />
          <span>임시 회원 등록</span>
        </p>
        <div>
          <Label htmlFor="name">이름</Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            placeholder="홍길동"
          />
        </div>
        <FormError>{data?.errors?.name}</FormError>
        <div>
          <Label htmlFor="address">주소</Label>
          <Input
            type="text"
            id="address"
            name="address"
            placeholder="서울특별시 ..."
          />
        </div>
        <div>
          <Label htmlFor="phone">전화번호</Label>
          <Input
            type="text"
            id="phone"
            name="phone"
            placeholder="010-1234-5678"
          />
        </div>
        <div>
          <Label htmlFor="birthDay">생년월일</Label>
          <Input
            type="text"
            id="birthDay"
            name="birthDay"
            placeholder="2000-01-01"
          />
        </div>
        <div>
          <FormSuccess>{success}</FormSuccess>
          <FormError>{errorMessage}</FormError>
        </div>
        <Button type="submit" className="w-full font-semibold">
          <span>등록</span>
          {isSubmitting && <Loading className="text-primary-foreground" />}
        </Button>
      </Form>
    </div>
  );
};

export default TempRegister;
