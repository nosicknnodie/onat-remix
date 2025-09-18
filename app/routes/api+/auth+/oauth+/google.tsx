import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { oauth } from "~/features/auth/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    return await oauth.service.startAuthorization("google", request);
  } catch (error) {
    console.error("Google OAuth start failed", error);
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("oauthError", "로그인이 현재 불가능합니다.");
    return redirect(url.toString());
  }
};

export const action = async () => {
  return new Response(null, { status: 405 });
};
