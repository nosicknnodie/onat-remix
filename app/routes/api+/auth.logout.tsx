import type { ActionFunctionArgs } from "@remix-run/node";
import { core } from "~/features/auth";

export const action = async ({ request }: ActionFunctionArgs) => {
  return core.service.logout(request);
};
