import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id;
  const slug = params.slug;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { board: true },
    });
    return { post };
  } catch (error) {
    return { success: false, errors: "Internal Server Error" };
  }
};

export const handle = {
  breadcrumb: (match: { data: any }) => match.data?.post?.title || "View",
};
interface IPostViewProps {}

const PostView = (_props: IPostViewProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const post = loaderData.post;
  return <>{post?.id}</>;
};

export default PostView;
