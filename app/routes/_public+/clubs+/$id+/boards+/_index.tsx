import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, NavLink, useLoaderData } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { FaRegComment } from "react-icons/fa";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { getBoardIcon } from "~/libs";
import { prisma } from "~/libs/index.server";

export const handle = {
  breadcrumb: "게시판",
};

export const loader = async ({ request: _request, params }: LoaderFunctionArgs) => {
  const clubId = params.id;

  try {
    const boards = await prisma.board.findMany({
      where: {
        isUse: true,
        clubId: clubId,
      },
      include: {
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
          where: { state: "PUBLISHED" },
          include: {
            _count: {
              select: {
                comments: { where: { parentId: null, isDeleted: false } },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });
    return { boards };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

interface IBoardsProps {}

const Boards = (_props: IBoardsProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const boards = loaderData.boards;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start grid grid-cols-1 md:grid-cols-2 gap-8">
        {boards?.map((board) => {
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
                      <NavLink
                        key={post.id}
                        to={`/clubs/${board.clubId}/boards/${board.slug}/${post.id}`}
                      >
                        <li className="hover:bg-primary/5 hover:text-primary px-2 py-0.5 rounded-md flex justify-between">
                          <span>{post.title}</span>
                          <Badge variant={"outline"} className="space-x-2">
                            <FaRegComment />
                            <span>{post._count.comments}</span>
                          </Badge>
                        </li>
                      </NavLink>
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

export default Boards;
