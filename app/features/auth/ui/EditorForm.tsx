import type { User } from "@prisma/client";
import { Form } from "@remix-run/react";
import type { ComponentProps } from "react";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/libs/utils";
import type { IEditorUserErrors } from "../types";

interface IEditorFormProps extends ComponentProps<typeof Form> {
  values: User;
  errors?: IEditorUserErrors["fieldErrors"];
  ok?: boolean;
  message?: string;
}

const EditorForm = ({
  values,
  errors,
  ok,
  message,
  className,
  method,
  ...props
}: IEditorFormProps) => {
  return (
    <>
      <Form method={method ?? "post"} className={cn("space-y-4", className)} {...props}>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input name="email" defaultValue={values.email} disabled />
        </div>
        <div>
          <Label htmlFor="name">
            이름<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input name="name" defaultValue={values.name ?? ""} required />
          <FormError>{errors?.name}</FormError>
        </div>
        <div>
          <Label htmlFor="password">비밀번호 변경</Label>
          <Input name="password" type="password" placeholder="••••••••" />
          <p className="text-sm text-muted-foreground">입력 시 비밀번호가 변경됩니다</p>
        </div>
        <FormSuccess>{ok && message}</FormSuccess>
        <FormError>{!ok && message}</FormError>
        <Button type="submit" className="w-full">
          정보 수정
        </Button>
      </Form>
    </>
  );
};

export default EditorForm;
