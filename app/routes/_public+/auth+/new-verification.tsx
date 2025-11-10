import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { service } from "~/features/auth/server";
import { lucia } from "~/libs/index.server";
import { fail } from "~/utils/action.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return redirect("/");

  const result = await service.verifyEmailWithToken(token);
  if (!result.ok) {
    return fail(result.message);
  }

  // session 생성은 라우트(HTTP 레이어)에서 담당
  const session = await lucia.createSession(result.data.userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
};

const NewVerificationPage = () => {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="flex justify-center items-center flex-col gap-2">
      <h1>토큰 Error</h1>
      <div className="text-destructive">{loaderData.message}</div>
    </div>
  );
};

export default NewVerificationPage;
