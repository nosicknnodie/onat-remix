import { Form } from "@remix-run/react";
import type { ComponentProps } from "react";
import { LuLogIn } from "react-icons/lu";
import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/libs";

interface ILoginFormProps extends ComponentProps<typeof Form> {
  values?: { email?: string };
  errors?: { email?: string; password?: string };
  success?: string;
  isSubmitting?: boolean;
  redirectTo?: string;
}

const LoginForm = ({
  values,
  errors,
  success,
  isSubmitting,
  redirectTo,
  className,
  method,
  ...props
}: ILoginFormProps) => {
  return (
    <>
      <Form method={method ?? "post"} className={cn("space-y-6", className)} {...props}>
        <p className="text-2xl font-semibold text-primary w-full flex justify-center items-center gap-x-2">
          <LuLogIn />
          <span>로그인</span>
        </p>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일
          </label>
          <Input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            defaultValue={values?.email ?? ""}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <Input
            type="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        <FormSuccess>{success}</FormSuccess>
        <FormError>{errors?.email}</FormError>
        <FormError>{errors?.password}</FormError>
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
        <Button
          type="submit"
          className="w-full font-semibold flex justify-center items-center gap-x-2"
          disabled={isSubmitting}
        >
          <span>로그인</span>
          {isSubmitting && <Loading className="text-primary-foreground" />}
        </Button>
      </Form>
    </>
  );
};

export default LoginForm;
