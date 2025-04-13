import type { ActionFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "~/auth/db.server";
import { auth } from "~/auth/lucia.server";

interface IRegisterProps {}

const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const result = registerSchema.safeParse({ email, password });

  if (!result.success) {
    return data(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return data(
      {
        errors: {
          email: ["이미 가입된 이메일입니다."],
        },
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email: result.data.email,
    },
  });

  await prisma.key.create({
    data: {
      id: `email:${result.data.email}`,
      userId: user.id,
      hashedPassword,
    },
  });

  const session = await auth.createSession(user.id, {});
  const sessionCookie = auth.createSessionCookie(session.id);

  return redirect("/profile/setup", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
};

const Register = () => {
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
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default Register;
