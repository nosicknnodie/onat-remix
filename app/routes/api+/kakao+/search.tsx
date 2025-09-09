import type { ActionFunctionArgs } from "@remix-run/node";
import { kakao } from "~/features/index.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const query = formData.get("query") as string;
  const page = formData.get("page") as string | number | null;
  const data = await kakao.service.searchKeyword({ query, page: page ?? "1" });
  return Response.json(data);
};
