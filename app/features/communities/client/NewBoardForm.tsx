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

export function NewBoardForm() {
  return (
    <form method="post">
      <Card>
        <CardHeader>
          <CardTitle>게시판 생성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">게시판명</Label>
            <Input name="name" placeholder="게시판명" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input name="slug" placeholder="ex) board" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">게시판 타입</Label>
            <Select name="type" defaultValue="TEXT">
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
            <Input type="number" name="order" placeholder="ex) 1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">저장</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
