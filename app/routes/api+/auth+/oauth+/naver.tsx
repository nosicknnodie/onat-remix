import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { oauthService } from "~/features/auth/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    return await oauthService.startAuthorization("naver", request);
  } catch (error) {
    console.error("Naver OAuth start failed", error);
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("oauthError", "로그인이 현재 불가능합니다.");
    return redirect(url.toString());
  }
};

export const action = async () => {
  return new Response(null, { status: 405 });
};
