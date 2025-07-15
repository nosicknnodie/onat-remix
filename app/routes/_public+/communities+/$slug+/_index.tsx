import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  try {
    const res = await prisma.board.findUnique({
      where: { slug },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          where: { state: "PUBLISHED" },
          include: {
            _count: { select: { comments: { where: { parentId: null } } } },
          },
        },
      },
    });
    return { posts: res?.posts };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

interface ISlugPageProps {}

const SlugPage = (_props: ISlugPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const posts = loaderData.posts;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start grid grid-cols-1 md:grid-cols-2 gap-8">
        <ul className="space-y-1 text-gray-700 text-sm">
          {posts?.map((post) => {
            return (
              <Fragment key={post.id}>
                <Link to={`./${post.id}`}>
                  <li className="hover:bg-primary/5 hover:text-primary px-2 py-0.5 rounded-md">
                    {post.title}{" "}
                    {post._count.comments > 0 && `(${post._count.comments})`}
                  </li>
                </Link>
              </Fragment>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default SlugPage;
