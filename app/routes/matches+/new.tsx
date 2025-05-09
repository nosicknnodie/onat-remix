import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

interface IMatchesNewProps {}

const MatchesNew = (_props: IMatchesNewProps) => {
  return (
    <>
      <div className="flex flex-col justify-start w-full space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/matches">매치</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>매치 생성</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>매치 생성</CardTitle>
            <CardDescription>매치를 생성합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">매치명</Label>
                  <Input id="title" name="title" type="text" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stDate">매치 날짜</Label>
                  <Input id="stDate" name="stDate" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeName">장소</Label>
                  <Input id="placeName" name="placeName" type="text" />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="isSelf">자체전 여부</Label>
                  <Switch id="isSelf" name="isSelf" />
                </div>
                <Button type="submit">저장</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MatchesNew;
