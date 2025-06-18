import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  try {
    const res = await prisma.board.findUnique({
      where: { slug },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { comments: { where: { parentId: null } } } },
          },
        },
      },
    });
    return { board: res };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

interface ISlugPageProps {}

const SlugPage = (_props: ISlugPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start grid grid-cols-1 md:grid-cols-2 gap-8">
        <ul className="space-y-1 text-gray-700 text-sm">
          {board?.posts.map((post) => {
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
    </>
  );
};

export default SlugPage;
