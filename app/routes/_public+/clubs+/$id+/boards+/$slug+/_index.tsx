import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { SerializedEditorState } from "lexical";
import _ from "lodash";
import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { FaRegComment } from "react-icons/fa6";
import { InfiniteSentinel } from "~/components/InfiniteSentinel";
import { Loading } from "~/components/Loading";
import { Preview } from "~/components/lexical/Preview";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { InfiniteListProvider, useInfiniteList } from "~/contexts/infinite";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import PostVoteBadgeButton from "~/template/post/PostVoteBadgeButton";
import Settings from "~/template/post/Settings";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const slug = params.slug!;
  const clubId = params.id!;
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take")) || 20, 50);
  const cursor = url.searchParams.get("cursor");
  try {
    const res = await prisma.board.findFirst({
      where: {
        slug: slug,
        clubId: clubId,
      },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          where: { state: "PUBLISHED" },
          take: take + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            author: {
              include: {
                userImage: true,
              },
            },
            votes: true,
            likes: {
              where: {
                userId: user?.id,
              },
              take: 1,
            },
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
    const posts = res?.posts ?? [];
    const hasMore = posts.length > take;
    const sliced = hasMore ? posts.slice(0, take) : posts;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;
    const exportPosts = sliced.map((post) => {
      return {
        ..._.omit(post, "votes"),
        sumVote: post.votes.reduce((acc, v) => acc + v.vote, 0),
        currentVote: post.votes.find((vote) => vote.userId === user?.id),
      };
    });
    if (!exportPosts) return { success: false, errors: "Not Found" };

    return {
      posts: exportPosts,
      board: res,
      pageInfo: { hasMore, nextCursor, take },
    };
  } catch (error) {
    console.error(error);
    return { success: false, errors: "Internal Server Error" };
  }
};

interface ISlugPageProps {}

const SlugPage = (_props: ISlugPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const [type, setType] = useState<"compact" | "card">(
    board?.type === "NOTICE" ? "compact" : "card",
  );
  useEffect(() => {
    setType(board?.type === "NOTICE" ? "compact" : "card");
  }, [board?.type]);
  return (
    <InfiniteListProvider
      key={board?.id}
      slug={board?.slug || ""}
      type={type}
      keySelector={(post) => String(post.id)}
      initialItems={loaderData.posts || []}
      initialPageInfo={loaderData.pageInfo || { hasMore: false, nextCursor: null, take: 20 }}
    >
      {type === "compact" ? <CompactTypeComponent /> : <CardTypeComponent />}
    </InfiniteListProvider>
  );
};

type LoaderData = Awaited<ReturnType<typeof loader>>;
// 성공 케이스만 추출해서 posts/pageInfo의 undefined를 제거
type LoaderSuccess = Extract<LoaderData, { posts: unknown }>;
type Post = LoaderSuccess["posts"][number];

const CompactTypeComponent = () => {
  const context = useInfiniteList<Post>();
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const items = context.state.items;
  const pageInfo = context.state.pageInfo;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start gap-8">
        <ul className="space-y-2 text-gray-700 text-sm">
          {items?.map((post) => {
            return (
              <Fragment key={post.id}>
                <Separator />
                <Card className="w-full border-0 shadow-none hover:bg-primary/5">
                  <CardHeader className="px-6 py-4 pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <Link to={`./${post.id}`} className="flex-1">
                        {post.title}
                      </Link>
                      <Settings
                        post={post}
                        editTo={`/clubs/${board?.clubId}/boards/${board?.slug}/${post.id}/edit`}
                      />
                    </CardTitle>
                  </CardHeader>
                  {/* <CardContent className="w-full break-words whitespace-pre-wrap text-sm">
                    <Link to={`./${post.id}`}>
                      <Preview editorState={post.content as any} />
                    </Link>
                  </CardContent> */}
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center gap-x-2">
                      {/* 아바타 이미지 */}
                      <Avatar className="size-6">
                        <AvatarImage
                          src={post.author.userImage?.url || "/images/user_empty.png"}
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
                    <div className="space-x-2">
                      <PostVoteBadgeButton post={post} />
                      {/* <PostLikeBadgeButton post={post} /> */}
                      <Badge variant={"outline"} className="space-x-2 ">
                        <Button variant={"ghost"} size={"icon"} className="h-4 w-4" asChild>
                          <Link to={`./${post.id}`}>
                            <FaRegComment />
                          </Link>
                        </Button>
                        <span>{post._count.comments}</span>
                      </Badge>
                    </div>
                  </CardFooter>
                </Card>
              </Fragment>
            );
          })}
          <InfiniteSentinel
            hasMore={pageInfo?.hasMore || false}
            onLoadMore={() => context.loadMore()}
          />
        </ul>
      </div>
    </>
  );
};

const CardTypeComponent = () => {
  const loaderData = useLoaderData<typeof loader>();
  const board = loaderData.board;
  const context = useInfiniteList<Post>();
  const items = context.state.items;
  const pageInfo = context.state.pageInfo;
  return (
    <>
      <div className="w-full md:p-2 2xl:p-3 justify-center items-start gap-8">
        <ul className="space-y-2 text-gray-700 text-sm">
          {items?.map((post) => {
            return (
              <Fragment key={post.id}>
                <Separator />
                <Card className="w-full border-0 shadow-none hover:bg-primary/5">
                  <CardHeader className=" space-y-4">
                    <div className="flex items-center gap-x-2 justify-between">
                      <div className="flex-1 flex items-center gap-x-2">
                        {/* 아바타 이미지 */}
                        <Avatar className="size-5">
                          <AvatarImage
                            src={post.author.userImage?.url || "/images/user_empty.png"}
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
                      <Settings
                        post={post}
                        editTo={`/clubs/${board?.clubId}/boards/${board?.slug}/${post.id}/edit`}
                      />
                    </div>
                    <Link to={`./${post.id}`}>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent className="w-full break-words whitespace-pre-wrap text-sm">
                    <Link to={`./${post.id}`}>
                      <Preview editorState={post.content as unknown as SerializedEditorState} />
                    </Link>
                  </CardContent>
                  <CardFooter className="space-x-2">
                    <PostVoteBadgeButton post={post} />
                    <Badge variant={"outline"} className="space-x-2">
                      <Button variant={"ghost"} size={"icon"} className="h-4 w-4" asChild>
                        <Link to={`./${post.id}`}>
                          <FaRegComment />
                        </Link>
                      </Button>
                      <span>{post._count.comments}</span>
                    </Badge>
                  </CardFooter>
                </Card>
              </Fragment>
            );
          })}
          <InfiniteSentinel
            hasMore={pageInfo?.hasMore || false}
            onLoadMore={() => context.loadMore()}
          />
        </ul>
      </div>
    </>
  );
};

export default SlugPage;
