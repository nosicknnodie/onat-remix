import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/libs/db/db.server";

interface ISlugBoardProps {}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug!;
  const clubId = params.id!;

  try {
    const board = await prisma.board.findUnique({
      where: {
        slug_clubId: {
          slug,
          clubId,
        },
      },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          where: { state: "PUBLISHED" },
          include: {
            author: {
              include: {
                userImage: true,
              },
            },
            votes: true,
            _count: {
              select: {
                comments: { where: { parentId: null, isDeleted: false } },
                likes: true,
              },
            },
          },
        },
      },
    });
    return { board };
  } catch (error) {
    console.log("error - ", error);
    return { success: false, errors: "Internal Server Error" };
  }
};

export const handle = {
  breadcrumb: (match: { data: any }) => (
    <Link
      to={`/clubs/${match.data?.board?.clubId}/boards/${match.data?.board?.slug}`}
    >
      {match.data?.board?.name || "게시판"}
    </Link>
  ),
};

const SlugBoard = (_props: ISlugBoardProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const posts = board?.posts;
  if (!board) return null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">{board?.name}</p>
        <Separator />
        <div>
          {posts?.map((post) => {
            return (
              <Link
                key={post.id}
                to={`/clubs/${board.clubId}/boards/${board.slug}/${post.id}`}
              >
                <p className="text-lg font-semibold">{post.title}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SlugBoard;
