import { type ActionFunctionArgs, data, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "~/auth/db.server";
import { auth } from "~/auth/lucia.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력하세요." }),
  password: z
    .string()
    .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors },
      { status: 401, statusText: "Bad Request" }
    );
  }
  try {
    const key = await prisma.key.findUnique({
      where: {
        id: `email:${email}`,
      },
    });
    if (!key || !key.hashedPassword) {
      return data(
        { errors: { password: "Invalid credentials" }, values: result.data },
        { status: 401 }
      );
    }
    const isValid = await bcrypt.compare(
      result.data.password,
      key.hashedPassword
    );

    if (!isValid) {
      return data(
        { errors: { password: "Invalid credentials" }, values: result.data },
        { status: 401 }
      );
    }
    const session = await auth.createSession(key.userId, {});
    const sessionCookie = auth.createSessionCookie(session.id);
    console.log("sessionCookie - ", sessionCookie);
    return redirect("/", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  } catch (_error) {
    return data(
      { errors: { password: "Invalid credentials" }, values: result.data },
      { status: 401 }
    );
  }
};

type IFormResult<T> = {
  errors?: Partial<Record<keyof T, string[]>>;
  values?: Partial<T>;
};

const Login = () => {
  const actions = useActionData<IFormResult<z.infer<typeof loginSchema>>>();
  return (
    <div className="max-w-md mx-auto mt-10">
      <form method="post" className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            이메일
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            required
            placeholder="you@example.com"
            defaultValue={actions?.values?.email ?? ""}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호
          </label>
          <Input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        {actions?.errors?.password && <p>{actions?.errors?.password}</p>}
        <Button type="submit">로그인</Button>
      </form>
    </div>
  );
};

export default Login;
