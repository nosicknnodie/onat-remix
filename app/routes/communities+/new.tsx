import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import { useState } from "react";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSession } from "~/contexts/AuthUserContext";
import { getUser } from "~/libs/db/lucia.server";
import { ILayoutContext } from "./_layout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!user) return redirect("/auth/login");
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return null;
};

interface ICommunityNewPageProps {}

const CommunityNewPage = (_props: ICommunityNewPageProps) => {
  const user = useSession();
  const outletData = useOutletContext<ILayoutContext>();
  const [content, setContent] = useState("");
  const boards = outletData?.boards
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
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>커뮤니티 글쓰기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">커뮤니티명</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="커뮤니티명" />
              </SelectTrigger>
              <SelectContent>
                {boards?.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" placeholder="제목" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <input type="hidden" name="content" value={content} />
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CommunityNewPage;
