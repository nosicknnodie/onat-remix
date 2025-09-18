import type { LoaderFunctionArgs } from "@remix-run/node";
import { oauth } from "~/features/auth/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return oauth.service.handleCallback("naver", request);
};

export const action = async () => {
  return new Response(null, { status: 405 });
};
