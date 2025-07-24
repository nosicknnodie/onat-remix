import { CommentVote, File, PostComment, User } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import { LexicalEditor, SerializedEditorState } from "lexical";
import _ from "lodash";
import { useState } from "react";
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
import { cn } from "~/libs/utils";
import CommentInput from "../_components/CommentInput";
import CommentVoteBadgeButton from "../_components/CommentVoteBadgeButton";
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

interface IPostViewProps {}

const PostView = (_props: IPostViewProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isTextMode, setIsTextMode] = useState(false);
  const post = loaderData.post;
  if (!post) {
    return <div>게시글이 존재하지 않습니다.</div>;
  }

  const mutation = useMutation({
    mutationFn: async ({
      root,
      parentId,
    }: {
      root: SerializedEditorState;
      parentId?: string;
    }) => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: root, postId: post.id, parentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.errors || "댓글 등록 실패");
      return result;
    },
  });

  const { data, refetch } = useQuery<CommentTreeNode[]>({
    queryKey: ["COMMENTS_QUERY", post.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`).then((res) =>
          res.json()
        );
        if (res.success) {
          return res.comments;
        } else {
          throw new Error(res.errors);
        }
      } catch (error) {
        console.error(error);
      }
    },
  });
  const comments = data?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const handleInputComment = async (
    root?: SerializedEditorState,
    editor?: LexicalEditor,
    parentId?: string
  ) => {
    if (!root) return;
    const res = await mutation.mutateAsync({ root, parentId });
    if (!res.success) return false;
    editor?.update(() => {
      editor.setEditorState(
        editor.parseEditorState({
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            version: 1,
          },
        })
      );
    });
    setIsTextMode(false);
    refetch();
  };

  return (
    <>
      <div>
        <Card className="w-full border-none shadow-none">
          <CardHeader className="relative space-y-4 max-md:p-1">
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
          <CardContent className="w-full break-words whitespace-pre-wrap text-sm max-md:p-1">
            <View editorState={post.content as any} />
          </CardContent>
          <CardFooter className="space-x-4 max-md:p-2">
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
          <CardContent className="max-md:p-1">
            {!isTextMode ? (
              <button
                onClick={() => setIsTextMode(true)}
                className={cn(
                  "rounded-3xl w-full flex justify-start items-center border borderㅊ-primary/30 py-4 px-4 text-sm cursor-text",
                  "hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5"
                )}
              >
                게시물 토론에 참여 합니다.
              </button>
            ) : (
              <CommentInput
                onSubmit={handleInputComment}
                onCancel={() => {
                  setIsTextMode(false);
                }}
              />
            )}
            <div className="py-2">
              {/* 코멘트 리스트 */}
              {comments?.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// 1. PostComment와 관계가 포함된 형태 (author + userImage 포함)
export type PostCommentWithAuthor = PostComment & {
  author: User & {
    userImage: File | null;
  };
  sumVote: number;
  currentVote: CommentVote | null;
};

// 2. 트리 구조를 위한 children 필드 포함
export type CommentTreeNode = PostCommentWithAuthor & {
  children: CommentTreeNode[];
};

function CommentItem({ comment }: { comment: CommentTreeNode }) {
  const loaderData = useLoaderData<typeof loader>();
  const post = loaderData.post;
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);

  if (!post) return null;

  const mutation = useMutation({
    mutationFn: async ({
      root,
      parentId,
    }: {
      root: SerializedEditorState;
      parentId?: string;
    }) => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: root, postId: post.id, parentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.errors || "댓글 등록 실패");
      return result;
    },
  });
  const handleInputComment = async (
    root?: SerializedEditorState,
    editor?: LexicalEditor,
    parentId?: string
  ) => {
    if (!root) return;
    const res = await mutation.mutateAsync({ root, parentId });
    if (!res.success) return false;
    editor?.update(() => {
      editor.setEditorState(
        editor.parseEditorState({
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            version: 1,
          },
        })
      );
    });
    setIsReplying(false);
    queryClient.invalidateQueries({
      queryKey: ["COMMENTS_QUERY", post.id],
    });
  };
  return (
    <div className="flex">
      <div className="h-10 flex items-center max-md:max-w-6">
        <Avatar className="size-8">
          <AvatarImage
            src={comment.author.userImage?.url || "/images/user_empty.png"}
          ></AvatarImage>
          <AvatarFallback className="bg-primary-foreground">
            <Loading />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="w-full">
        <div className="h-10 flex items-center gap-2 ml-2 text-sm">
          <span>{comment.author.name}</span>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-muted-foreground text-xs">
            {formatDistance(comment.createdAt, new Date(), {
              addSuffix: true,
              locale: ko,
            })}
          </span>
        </div>
        <div className="w-full rounded-lg ml-2">
          <View editorState={comment.content as any} className="min-h-0 " />
        </div>
        <div className="flex gap-2">
          <CommentVoteBadgeButton comment={comment} />
          <Button
            variant={"ghost"}
            onClick={() => setIsReplying((v) => !v)}
            className="text-xs text-gray-500 flex items-center gap-2 rounded-lg"
          >
            <FaRegComment />
            Reply
          </Button>
        </div>
        {isReplying && (
          <CommentInput
            parentId={comment.id}
            onCancel={() => setIsReplying(false)}
            onSubmit={handleInputComment}
            placeholder={`@${comment.author.name} Reply...`}
          />
        )}
        {comment.children.map((child) => (
          <CommentItem key={child.id} comment={child} />
        ))}
      </div>
    </div>
  );
}

export default PostView;
