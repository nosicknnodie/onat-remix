import type { ActionFunctionArgs } from "@remix-run/node";
import { core } from "~/features/auth/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return core.service.logout(request);
};
