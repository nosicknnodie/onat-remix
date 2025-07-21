import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormError from "~/components/FormError";
import { PostEditor } from "~/components/lexical/PostEditor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSession } from "~/contexts/AuthUserContext";
import { prisma } from "~/libs/db/db.server";
import { getUser } from "~/libs/db/lucia.server";
import { parseRequestData } from "~/libs/requestData";
import { cn } from "~/libs/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  /**
   * TODO:
   * 1. user Id 를 기반으로 state 필드가 draft 인것이 있는지 확인해서 first 인것 가져오기
   * 2. draft 의 내용이 없으면 create post 를 해서 draft 해서 가져오기
   *
   */

  try {
    const res = await prisma.$transaction(async (tx) => {
      const draftPost = await tx.post.findFirst({
        where: {
          authorId: user.id,
          state: "DRAFT",
        },
      });

      if (!draftPost) {
        const post = await tx.post.create({
          data: {
            authorId: user.id,
            title: "",
            state: "DRAFT",
          },
        });
        return post;
      }
      return draftPost;
    });
    const boards = await prisma.board.findMany({
      where: { isUse: true },
      orderBy: { order: "asc" },
    });
    return { post: res, boards };
  } catch (error) {
    console.error(error);
    return redirect("../");
  }
};

const postScheme = z.object({
  id: z.string().min(1, "ID 는 필수 입니다."),
  boardId: z.string().nonempty("게시판 선택은 필수 입니다."),
  title: z.string().nonempty("제목은 한글자 이상 필수입니다."),
  content: z.string().nonempty("내용은 한글자 이상 필수입니다."),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  const data = await parseRequestData(request);

  const result = postScheme.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
      post: result.data,
    };
  }
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: result.data.id,
      },
    });
    if (post?.authorId !== user.id) {
      return { error: "게시글 권한이 없습니다." };
    }
    const res = await prisma.post.update({
      where: {
        id: result.data.id,
      },
      data: {
        boardId: result.data.boardId,
        state: "PUBLISHED",
        title: result.data.title,
        content: JSON.parse(result.data.content),
      },
    });
    const board = await prisma.board.findUnique({
      where: {
        id: result.data.boardId,
      },
    });
    return redirect("/communities/" + board?.slug + "/" + res.id);
  } catch (error) {
    console.error(error);
    return { success: false, error: "Internal Server Error" };
  }
};

interface ICommunityNewPageProps {}

const CommunityNewPage = (_props: ICommunityNewPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const user = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const post = loaderData.post;

  const form = useForm<z.infer<typeof postScheme>>({
    resolver: zodResolver(postScheme),
    defaultValues: {
      id: post?.id,
      boardId: post?.boardId || "",
      title: post?.title || "",
      content: post?.content ? JSON.stringify(post?.content) : undefined,
    },
  });

  const boards = loaderData?.boards
    .filter((board) =>
      board.isUse && board.writeRole === "ADMIN" ? user?.role === "ADMIN" : true
    )
    .sort((a, b) => {
      if (a.isUse && !b.isUse) return -1;
      if (!a.isUse && b.isUse) return 1;

      // Both are same in isUse
      if (a.isUse && b.isUse) {
        return a.order - b.order;
      }

      return 0;
    });

  const handleOnValid = () => {
    formRef.current?.submit();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>글쓰기</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(handleOnValid)}
              method="post"
              className="space-y-2"
            >
              <input
                type="hidden"
                name="id"
                value={form.getValues("id") ?? ""}
              />
              <FormField
                name="boardId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>게시판 명</FormLabel>
                    <Select
                      name={field.name}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={cn({
                            "ring-red-500 ring-1": fieldState.invalid,
                          })}
                        >
                          <SelectValue placeholder="게시판 명" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {boards?.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="flex justify-end" />
                  </FormItem>
                )}
              />
              {/* <div className="space-y-2">
              <Label htmlFor="name">게시판 명</Label>
              <Select name="boardId" defaultValue={post?.boardId ?? undefined}>
                <SelectTrigger
                  className={cn({
                    "border border-red-500": hasError("boardId"),
                  })}
                >
                  <SelectValue placeholder="게시판 명" />
                </SelectTrigger>
                <SelectContent>
                  {boards?.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
              <FormField
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={cn({
                          "ring-red-500 ring-1": fieldState.invalid,
                        })}
                        placeholder="제목"
                      />
                    </FormControl>
                    <FormMessage className="justify-end flex" />
                  </FormItem>
                )}
              />
              <FormField
                name="content"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <input
                      name="content"
                      value={field.value || ""}
                      onChange={() => {}}
                      type="hidden"
                    />
                    <FormControl>
                      <PostEditor
                        onChange={(value) =>
                          field.onChange(JSON.stringify(value))
                        }
                        initialEditorState={
                          field.value ? JSON.parse(field.value) : undefined
                        }
                        className={cn({
                          "ring-red-500 ring-1": fieldState.invalid,
                        })}
                      />
                    </FormControl>
                    <FormMessage className="justify-end flex" />
                  </FormItem>
                )}
              />
              <div>
                <FormError>
                  {actionData?.success === false &&
                    (actionData.errors?.formErrors?.[0] ??
                      actionData.errors?.fieldErrors?.boardId?.[0] ??
                      actionData.errors?.fieldErrors?.title?.[0] ??
                      actionData.errors?.fieldErrors?.content?.[0])}
                </FormError>
              </div>
              <div className="space-y-2">
                <Button type="submit">저장</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default CommunityNewPage;
