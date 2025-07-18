import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import { AiOutlineLike } from "react-icons/ai";
import { FaArrowAltCircleLeft, FaRegComment } from "react-icons/fa";
import { View } from "~/components/lexical/View";
import { Loading } from "~/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { prisma } from "~/libs/db/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id;
  const slug = params.slug;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        board: true,
        author: { include: { userImage: true } },
        _count: { select: { comments: { where: { parentId: null } } } },
      },
    });
    return { post };
  } catch (error) {
    return { success: false, errors: "Internal Server Error" };
  }
};

// export const handle = {
//   breadcrumb: (match: { data: any }) => match.data?.post?.title || "View",
// };
interface IPostViewProps {}

const PostView = (_props: IPostViewProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const post = loaderData.post;
  if (!post) {
    return <div>게시글이 존재하지 않습니다.</div>;
  }
  return (
    <>
      <div>
        <Card className="w-full border-none shadow-none">
          <CardHeader className="relative space-y-4">
            <div className="absolute top-0 left-0 -translate-x-full translate-y-full">
              <Link to={"../"}>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  className="hover:text-primary"
                  asChild
                >
                  <FaArrowAltCircleLeft className="size-8 text-muted" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-x-2">
              {/* 아바타 이미지 */}
              <Avatar className="size-5">
                <AvatarImage
                  src={post?.author.userImage?.url || "/images/user_empty.png"}
                ></AvatarImage>
                <AvatarFallback className="bg-primary-foreground">
                  <Loading />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{post.author.name}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-xs">
                {formatDistance(post.createdAt, new Date(), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
            <CardTitle className="text-lg">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="w-full break-words whitespace-pre-wrap text-sm">
            <View editorState={post.content as any} />
          </CardContent>
          <CardFooter className="space-x-2">
            <Badge variant={"outline"} className="space-x-2">
              <Button variant={"ghost"} size={"icon"} className="h-4 w-4">
                <AiOutlineLike />
              </Button>
              <span>112</span>
            </Badge>
            <Badge variant={"outline"} className="space-x-2">
              <Button
                variant={"ghost"}
                size={"icon"}
                className="h-4 w-4"
                asChild
              >
                <FaRegComment />
              </Button>
              <span>{post._count.comments}</span>
            </Badge>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default PostView;
