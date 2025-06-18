import { BoardType } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  FaBullhorn,
  FaLink,
  FaRegFileAlt,
  FaRegImages,
  FaRegPlayCircle,
} from "react-icons/fa";
import { Fragment } from "react/jsx-runtime";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/libs/db/db.server";

const getBoardIcon = (type: BoardType) => {
  switch (type) {
    case "TEXT":
      return <FaRegFileAlt className="text-primary" />;
    case "GALLERY":
      return <FaRegImages className="text-primary" />;
    case "VIDEO":
      return <FaRegPlayCircle className="text-primary" />;
    case "NOTICE":
      return <FaBullhorn className="text-primary" />;
    case "LINK":
      return <FaLink className="text-primary" />;
    default:
      return null;
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const boards = await prisma.board.findMany({
    where: { isUse: true },
    orderBy: { order: "asc" },
    include: {
      posts: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { comments: { where: { parentId: null } } } },
        },
      },
    },
  });
  return { boards };
};

interface ICommunitiesPageProps {}

const CommunitiesPage = (_props: ICommunitiesPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const boards = loaderData.boards;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start grid grid-cols-1 md:grid-cols-2 gap-8">
        {boards.map((board) => {
          return (
            <Fragment key={board.id}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <h2 className="text-lg font-semibold flex items-center gap-x-2">
                    {getBoardIcon(board.type)}
                    {board.name}
                  </h2>
                  <Link
                    to={`./${board.slug}`}
                    className="text-xs font-semibold text-black hover:underline"
                  >
                    더 보기 &gt;
                  </Link>
                </div>
                <Separator />
                <ul className="space-y-1 text-gray-700 text-sm">
                  {board.posts.map((post) => {
                    return (
                      <li
                        key={post.id}
                        className="hover:bg-primary-foreground px-2 py-0.5 rounded-md"
                      >
                        {post.title} ({post._count.comments})
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
};

export default CommunitiesPage;
