import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  const clubId = params.id;
  try {
    const res = await prisma.board.findFirst({
      where: { slug, clubId },
    });
    return { board: res };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

export const handle = {
  breadcrumb: (match: { data: any }) => {
    return (
      <Link
        to={`/clubs/${match.data?.board?.clubId}/boards/${match.data?.board?.slug}`}
      >
        {match.data?.board?.name || "게시판"}
      </Link>
    );
  },
};

export default function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}
