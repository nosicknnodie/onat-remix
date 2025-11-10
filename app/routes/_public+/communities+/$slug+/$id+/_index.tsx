import type { CommentVote, File, PostComment, User } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import type { LexicalEditor, SerializedEditorState } from "lexical";
import { useState, useTransition } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { FaArrowAltCircleLeft, FaRegComment } from "react-icons/fa";
import { Loading } from "~/components/Loading";
import { View } from "~/components/lexical/View";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { useSession } from "~/contexts";
import {
  CommentInput,
  CommentSettings,
  CommentVoteBadgeButton,
  PostVoteBadgeButton,
  Settings,
} from "~/features/communities/client";
import { service } from "~/features/communities/server";
import { cn } from "~/libs";
import { getUser } from "~/libs/index.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  const id = params.id as string;
  try {
    const result = await service.getPostDetail(id, user?.id);
    if (!result) return { success: false, errors: "Not Found" };
    return result;
  } catch (_error) {
    console.error(_error);
    return { success: false, errors: "Internal Server Error" };
  }
};

interface IPostViewProps {}

const PostView = (_props: IPostViewProps) => {
  const loaderData = useLoaderData<typeof loader>();
  // const fetcher = useFetcher();
  const session = useSession();
  const [isTextMode, setIsTextMode] = useState(false);
  const [path, setPath] = useState<string | undefined>(undefined);
  const post = "post" in loaderData ? loaderData.post : undefined;

  const mutation = useMutation({
    mutationFn: async ({ root, parentId }: { root: SerializedEditorState; parentId?: string }) => {
      const res = await fetch(`/api/posts/${post?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: root, postId: post?.id, parentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.errors || "댓글 등록 실패");
      return result;
    },
  });

  const { data, refetch } = useQuery<{
    comments: CommentTreeNode[];
    success: boolean;
    isMobile: boolean;
    limitDepth: number;
    startDepth: number;
  }>({
    queryKey: ["COMMENTS_QUERY", post?.id, path],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(
          `/api/posts/${post?.id}/comments${path ? `?path=${queryKey[2]}` : ""}`,
        ).then((res) => res.json());
        if (res.success) {
          return res;
        } else {
          throw new Error(res.errors);
        }
      } catch (error) {
        console.error(error);
      }
    },
    enabled: Boolean(post?.id),
  });
  // Helper to recursively sort a comment tree node array by createdAt descending
  function sortCommentTreeRedditLike(nodes: CommentTreeNode[]): CommentTreeNode[] {
    return nodes
      .map((node) => ({
        ...node,
        children: sortCommentTreeRedditLike(node.children),
      }))
      .sort((a, b) => {
        // 1. 삭제 여부 (false가 우선 → !a.isDeleted)
        if (a.isDeleted !== b.isDeleted) {
          return Number(a.isDeleted) - Number(b.isDeleted);
        }
        // 2. score (높은 순)
        if (b.sumVote !== a.sumVote) {
          return b.sumVote - a.sumVote;
        }
        // 3. 최신 댓글이 위
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  const comments = data ? sortCommentTreeRedditLike(data.comments) : [];

  if (!post) {
    return <div>게시글이 존재하지 않습니다.</div>;
  }
  const handleInputComment = async (
    root?: SerializedEditorState,
    editor?: LexicalEditor,
    parentId?: string,
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
        }),
      );
    });
    setIsTextMode(false);
    refetch();
  };

  // post 존재는 상단에서 분기 처리됨
  return (
    <>
      <div>
        <Card className="w-full border-none shadow-none">
          <CardHeader className="relative space-y-4 max-md:p-1">
            <div className="flex justify-between">
              <div className="flex items-center gap-x-2">
                <Link to={"../"} className="max-md:hidden">
                  <Button variant={"ghost"} size={"icon"} className="hover:text-primary" asChild>
                    <FaArrowAltCircleLeft className="size-8 text-muted" />
                  </Button>
                </Link>
                {/* 아바타 이미지 */}
                <Avatar className="size-8">
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
            </div>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="w-full break-words whitespace-pre-wrap text-sm max-md:p-1">
            <View editorState={post.content as unknown as SerializedEditorState} />
          </CardContent>
          <CardFooter className="space-x-4 max-md:p-2">
            <PostVoteBadgeButton post={post} />
            {/* <PostLikeBadgeButton post={post} /> */}
            <Badge variant={"outline"} className="space-x-2">
              <Button variant={"ghost"} size={"icon"} className="h-4 w-4" asChild>
                <FaRegComment />
              </Button>
              <span>{post._count.comments}</span>
            </Badge>
            <Settings post={post} editTo={`/communities/${post.board?.slug}/${post?.id}/edit`} />
          </CardFooter>
          <CardContent className="max-md:p-1">
            {session && (
              <>
                {!isTextMode ? (
                  <button
                    type="button"
                    onClick={() => setIsTextMode(true)}
                    className={cn(
                      "rounded-3xl w-full flex justify-start items-center border borderㅊ-primary/30 py-4 px-4 text-sm cursor-text",
                      "hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5",
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
              </>
            )}
            <div className="py-2">
              {(data?.startDepth || 0) > 0 && (
                <Button
                  variant={"ghost"}
                  className="text-xs space-x-2"
                  onClick={() => setPath(undefined)}
                >
                  <FaArrowAltCircleLeft />
                  <span>전체 코멘트</span>
                </Button>
              )}
              {/* 코멘트 리스트 */}
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  limitDepth={data?.limitDepth}
                  isMobile={data?.isMobile}
                  onMoreReplies={(path) => setPath(path)}
                />
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

function CommentItem({
  comment,
  isMobile,
  limitDepth,
  onMoreReplies,
}: {
  comment: CommentTreeNode;
  isMobile?: boolean;
  limitDepth?: number;
  onMoreReplies?: (path: string) => void;
}) {
  const loaderData = useLoaderData<typeof loader>();
  const post = "post" in loaderData ? loaderData.post : undefined;
  const session = useSession();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [, _startTransition] = useTransition();

  const mutation = useMutation({
    mutationFn: async ({ root, parentId }: { root: SerializedEditorState; parentId?: string }) => {
      const res = await fetch(`/api/posts/${post?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: root, postId: post?.id, parentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.errors || "댓글 등록 실패");
      return result;
    },
  });
  const handleInputComment = async (root?: SerializedEditorState, editor?: LexicalEditor) => {
    if (!root) return;
    const res = await mutation.mutateAsync({ root, parentId: comment.id });
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
        }),
      );
    });
    setIsReplying(false);
    queryClient.invalidateQueries({
      queryKey: ["COMMENTS_QUERY", post?.id],
    });
  };
  const handleEditComment = async (
    root?: SerializedEditorState,
    _editor?: LexicalEditor,
  ): Promise<boolean | undefined> => {
    if (!root) return false;
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: root }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error(result);
      return false;
    }
    await queryClient.invalidateQueries({
      queryKey: ["COMMENTS_QUERY", post?.id],
    });
    setIsEditorMode(false);
    return true;
  };

  if (!post) return null;

  if (comment.isDeleted && comment.children.length === 0 && comment.authorId !== session?.id)
    return null;

  return (
    <div
      className={cn("flex", {
        "mt-2": comment.isDeleted,
      })}
    >
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
        {comment.isDeleted && (
          <div className="h-10 flex items-center gap-2 ml-2 text-sm">
            <span className="text-xs italic">삭제된 댓글입니다.</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">
              {formatDistance(comment.createdAt, new Date(), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
        )}
        {!comment.isDeleted && (
          <>
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
            {isEditorMode && (
              <CommentInput
                onCancel={() => setIsEditorMode(false)}
                onSubmit={handleEditComment}
                initialEditorState={comment.content as unknown as SerializedEditorState}
              />
            )}
            {!isEditorMode && (
              <>
                <div className="w-full rounded-lg ml-2">
                  <View
                    editorState={comment.content as unknown as SerializedEditorState}
                    className="min-h-0 "
                  />
                </div>
                <div className="flex gap-2">
                  <CommentVoteBadgeButton comment={comment} />
                  {session && (
                    <Button
                      variant={"ghost"}
                      onClick={() => setIsReplying((v) => !v)}
                      className="text-xs text-gray-500 flex items-center gap-2 rounded-lg"
                    >
                      <FaRegComment />
                      Reply
                    </Button>
                  )}
                  <CommentSettings comment={comment} onEditorOpen={() => setIsEditorMode(true)} />
                </div>
              </>
            )}
            {isReplying && !isEditorMode && (
              <CommentInput
                onCancel={() => setIsReplying(false)}
                onSubmit={handleInputComment}
                placeholder={`@${comment.author.name} Reply...`}
              />
            )}
          </>
        )}
        {comment.depth + 1 >= (limitDepth ?? 3) && comment.children.length > 0 && (
          <Button
            variant={"ghost"}
            className="italic text-xs space-x-2 -ml-4"
            onClick={() => onMoreReplies?.(comment.path)}
          >
            <CiCirclePlus />
            <span>more reply {comment.children.length}</span>
          </Button>
        )}
        {comment.depth + 1 < (limitDepth ?? 3) &&
          comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              isMobile={isMobile}
              limitDepth={limitDepth}
              onMoreReplies={onMoreReplies}
            />
          ))}
      </div>
    </div>
  );
}

export default PostView;
