import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "~/libs/utils";
import { validators } from "..";
import type { BoardListItem, DraftPost } from "../types";

export type ActionErrors =
  | {
      formErrors?: string[];
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | null
  | undefined;

interface NewPostFormProps {
  post: DraftPost;
  boards: BoardListItem[];
  actionErrors?: ActionErrors;
}

const NewPostForm = ({ post, boards, actionErrors }: NewPostFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<validators.NewPostInput>({
    resolver: zodResolver(validators.postSchema),
    defaultValues: {
      id: post?.id,
      boardId: post?.boardId || "",
      title: post?.title || "",
      content: post?.content ? JSON.stringify(post?.content) : undefined,
    },
  });

  const handleOnValid = () => {
    formRef.current?.submit();
  };

  const handleOnUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subId", post.id);
    const res = await fetch("/api/upload/post-image", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  };

  return (
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
            <input type="hidden" name="id" value={form.getValues("id") ?? ""} />
            <FormField
              name="boardId"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>게시판 명</FormLabel>
                  <Select name={field.name} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn({ "ring-red-500 ring-1": fieldState.invalid })}>
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
            <FormField
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={cn({ "ring-red-500 ring-1": fieldState.invalid })}
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
                      onChange={(value) => field.onChange(JSON.stringify(value))}
                      initialEditorState={field.value ? JSON.parse(field.value) : undefined}
                      onUploadImage={handleOnUploadImage}
                      className={cn({ "ring-red-500 ring-1": fieldState.invalid })}
                    />
                  </FormControl>
                  <FormMessage className="justify-end flex" />
                </FormItem>
              )}
            />
            <div>
              <FormError>
                {actionErrors?.formErrors?.[0] ??
                  actionErrors?.fieldErrors?.boardId?.[0] ??
                  actionErrors?.fieldErrors?.title?.[0] ??
                  actionErrors?.fieldErrors?.content?.[0]}
              </FormError>
            </div>
            <div className="space-y-2">
              <Button type="submit">저장</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default NewPostForm;
