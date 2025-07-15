import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  try {
    const res = await prisma.board.findUnique({
      where: { slug },
    });
    return { board: res };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

export const handle = {
  breadcrumb: (match: { data: any }) => match.data?.board?.name || "게시판",
};

export default function Layout() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet context={{ board: loaderData.board }} />
    </>
  );
}
