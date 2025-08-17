import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({
  request: _request,
  params,
}: LoaderFunctionArgs) => {
  const slug = params.slug;
  try {
    const res = await prisma.board.findFirst({
      where: { slug, clubId: null },
    });
    return { board: res };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

export const handle = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  breadcrumb: (match: { data: any }) => (
    <Link to={`/communities/${match.data?.board?.slug}`}>
      {match.data?.board?.name || "게시판"}
    </Link>
  ),
};

export default function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}
