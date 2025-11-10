import type { LoaderFunctionArgs } from "@remix-run/node";
import { oauthService } from "~/features/auth/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return oauthService.handleCallback("google", request);
};

export const action = async () => {
  return new Response(null, { status: 405 });
};
