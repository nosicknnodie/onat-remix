import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { service } from "~/features/clubs/index.server";
import { getUser } from "~/libs/index.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const clubs = await service.getMyClubsData(user?.id);
  return json(clubs);
};
