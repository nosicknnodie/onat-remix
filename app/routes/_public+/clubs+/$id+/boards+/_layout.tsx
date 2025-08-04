import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;
  const slug = params.slug;

  const board = await prisma.board.findMany({
    where: {
      slug,
      clubId,
    },
  });

  if (board.length === 0) {
    await prisma.board.createMany({
      data: [
        {
          clubId,
          name: "공지사항",
          slug: "notice",
          order: 0,
          type: "NOTICE",
        },
        {
          clubId,
          name: "자유게시판",
          slug: "free",
          order: 10,
          type: "TEXT",
        },
        {
          clubId,
          name: "갤러리",
          slug: "gallery",
          order: 20,
          type: "GALLERY",
        },
        {
          clubId,
          name: "자료실",
          slug: "archive",
          order: 30,
          type: "ARCHIVE",
        },
      ],
    });
  }

  return {};
};

interface ILayoutProps {}

const Layout = (_props: ILayoutProps) => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default Layout;
