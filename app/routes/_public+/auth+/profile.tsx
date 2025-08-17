import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ImageCropperDialog from "~/template/cropper/ImageCropperDialog";

interface IProfileProps {}

const Profile = (_props: IProfileProps) => {
  return (
    <>
      <Tabs className="w-full" defaultValue="default">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="default">기본 정보</TabsTrigger>
          <TabsTrigger value="position">포지션</TabsTrigger>
          <TabsTrigger value="details">선수 정보</TabsTrigger>
        </TabsList>
        <form className="space-y-6">
          <TabsContent value="default">
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <p className="text-2xl font-semibold text-center">🪽 기본 정보</p>
              </CardHeader>
              <CardContent>
                <div className="space-x-4 w-full flex justify-center min-h-[120px]">
                  <ImageCropperDialog title="이미지 변경" descirption="이미지를 변경합니다.">
                    이미지 변경
                  </ImageCropperDialog>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit">저장</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="position">
            <Card>
              <CardHeader>
                <p className="text-2xl font-semibold text-center">🪽 포지션</p>
              </CardHeader>
              <CardDescription className="flex justify-center">
                포지션 3개를 등록해주세요.
              </CardDescription>
              <CardContent></CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit">저장</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <p className="text-2xl font-semibold text-center">🪽 선수 정보</p>
              </CardHeader>
              <CardContent>
                <FormError></FormError>
                <FormSuccess></FormSuccess>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit">저장</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </>
  );
};

export default Profile;
