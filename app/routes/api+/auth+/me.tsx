import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/libs/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return Response.json(
    { user },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
