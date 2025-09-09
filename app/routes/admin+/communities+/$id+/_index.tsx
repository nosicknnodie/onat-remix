import { BoardType, UserRoleType } from "@prisma/client";
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { prisma } from "~/libs/db/db.server";
import { parseRequestData } from "~/libs/requestData.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const board = await prisma.board.findUnique({ where: { id } });
  return { board };
};

const toNullableRole = (role: string | null): UserRoleType | null => {
  if (role === "ALL") return null;
  return role as UserRoleType;
};

const boardScheme = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1, "slug is required"),
  type: z.nativeEnum(BoardType),
  order: z.string().min(1, "order is required"),
  readRole: z.union([z.nativeEnum(UserRoleType), z.literal("ALL")]),
  writeRole: z.union([z.nativeEnum(UserRoleType), z.literal("ALL")]),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const id = params.id;
  const data = await parseRequestData(request);
  const result = boardScheme.safeParse(data);
  if (!result.success) {
    return Response.json({ success: false, errors: result.error.flatten() }, { status: 400 });
  }
  try {
    const res = await prisma.board.update({
      where: {
        id,
      },
      data: {
        name: result.data.name,
        slug: result.data.slug,
        type: result.data.type,
        order: Number(result.data.order),
        readRole: toNullableRole(result.data.readRole),
        writeRole: toNullableRole(result.data.writeRole),
      },
    });
    if (res.id) {
      return redirect("/admin/communities");
    }
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, errors: "Internal Server Error" }, { status: 500 });
  }
  return null;
};

interface ICommunityEditPageProps {}

const CommunityEditPage = (_props: ICommunityEditPageProps) => {
  const loaderData = useLoaderData<typeof loader>();
  // const actionData = useActionData<typeof action>();
  // console.log("actionData - ", actionData);
  const board = loaderData.board;
  return (
    <>
      <div className="w-full">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="../">커뮤니티 관리</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>게시판 수정</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <form method="post">
          <Card>
            <CardHeader>
              <CardTitle>게시판 수정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">게시판명</Label>
                <Input name="name" placeholder="게시판명" defaultValue={board?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  name="slug"
                  placeholder="ex) board"
                  defaultValue={board?.slug ?? undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">게시판 타입</Label>
                <Select name="type" defaultValue={board?.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="게시판 타입" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">일반</SelectItem>
                    <SelectItem value="GALLERY">갤러리</SelectItem>
                    <SelectItem value="VIDEO">비디오</SelectItem>
                    <SelectItem value="NOTICE">공지</SelectItem>
                    <SelectItem value="LINK">링크 및 자료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="readRole">읽기 권한</Label>
                <Select name="readRole" defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="읽기 권한" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="NORMAL">회원</SelectItem>
                    <SelectItem value="ADMIN">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="writeRole">쓰기 권한</Label>
                <Select name="writeRole" defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="쓰기 권한" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="NORMAL">회원</SelectItem>
                    <SelectItem value="ADMIN">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">게시판 우선순위</Label>
                <Input type="number" name="order" placeholder="ex) 1" defaultValue={board?.order} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">저장</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
};

export default CommunityEditPage;
