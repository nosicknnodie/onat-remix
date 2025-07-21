import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import _ from "lodash";
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
import { getUser } from "~/libs/db/lucia.server";
import CommentInput from "../_components/CommentInput";
import PostVoteBadgeButton from "../_components/PostVoteBadgeButton";
import Settings from "../_components/Settings";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const id = params.id;
  const slug = params.slug;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        board: true,
        author: { include: { userImage: true } },
        likes: {
          where: {
            userId: user?.id,
          },
        },
        votes: true,
        _count: {
          select: { comments: { where: { parentId: null } }, likes: true },
        },
      },
    });
    // const posts = res?.posts.map((post) => {
    //   return {
    //     ..._.omit(post, "votes"),
    //     sumVote: post.votes.reduce((acc, v) => acc + v.vote, 0),
    //     currentVote: post.votes.find((vote) => vote.userId === user?.id),
    //   };
    // });
    if (!post) return { success: false, errors: "Not Found" };
    return {
      post: {
        ..._.omit(post, "votes"),
        sumVote: post.votes.reduce((acc, v) => acc + v.vote, 0),
        currentVote: post.votes.find((vote) => vote.userId === user?.id),
      },
    };
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
            <div className="flex justify-between">
              <div className="flex items-center gap-x-2">
                <Link to={"../"} className="max-md:hidden">
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    className="hover:text-primary"
                    asChild
                  >
                    <FaArrowAltCircleLeft className="size-8 text-muted" />
                  </Button>
                </Link>
                {/* 아바타 이미지 */}
                <Avatar className="size-8">
                  <AvatarImage
                    src={
                      post?.author.userImage?.url || "/images/user_empty.png"
                    }
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
              <Settings board={post.board} post={post} />
            </div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="w-full break-words whitespace-pre-wrap text-sm">
            <View editorState={post.content as any} />
          </CardContent>
          <CardFooter className="space-x-4">
            <PostVoteBadgeButton post={post} />
            {/* <PostLikeBadgeButton post={post} /> */}
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
          <CardContent>
            <CommentInput />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PostView;
