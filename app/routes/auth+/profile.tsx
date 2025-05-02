import FormError from "~/components/FormError";
import FormSuccess from "~/components/FormSuccess";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
// import Position from "~/templates/profile/Position";
// import Profile from "~/templates/profile/Profile";
// import ProfileImage from "~/templates/profile/ProfileImage";

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
                <p className="text-2xl font-semibold text-center">
                  🪽 기본 정보
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-x-4 w-full flex justify-center min-h-[120px]">
                  {/* <FormField
                    name="imageUrl"
                    render={({ field }) => (
                      <>
                        <ProfileImage
                            onSetImage={(image?: string) => {
                              // form.setValue("imageData", image);
                              // setImageData(image);
                            }}
                            imageUrl={["profiles", field.value].join("/")}
                          />
                      </>
                    )}
                  ></FormField> */}
                </div>
                {/* <Profile form={form} isPending={isPending} /> */}

                {/* <FormError message={message.error} />
                  <FormSuccess message={message.success} /> */}
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
              <CardContent>
                {/* <Position
                    isPending={isPending}
                    value={compact([
                      form.getValues().position1,
                      form.getValues().position2,
                      form.getValues().position3,
                    ])}
                    onValueChange={(v) => {
                      form.setValue("position1", v?.[0] ?? null);
                      form.setValue("position2", v?.[1] ?? null);
                      form.setValue("position3", v?.[2] ?? null);
                      form.trigger("position1");
                    }}
                  /> */}
                {/* <FormError message={message.error} />
                  <FormSuccess message={message.success} /> */}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit">저장</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <p className="text-2xl font-semibold text-center">
                  🪽 선수 정보
                </p>
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
