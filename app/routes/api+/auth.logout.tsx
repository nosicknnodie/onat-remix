import type { ActionFunctionArgs } from "@remix-run/node";
import { service } from "~/features/auth/server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return service.logout(request);
};
